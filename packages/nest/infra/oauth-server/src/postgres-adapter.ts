import { createHash } from 'node:crypto';
import { and, eq, gt, isNull, or, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { errors, type Adapter, type AdapterPayload } from 'oidc-provider';
import { oauthArtifacts, oauthClients } from './oauth-server.schema.js';
import type * as schema from './oauth-server.schema.js';

export class AdapterConsumeConflictError extends errors.InvalidGrant {
	constructor() {
		super('OAuth artifact was already consumed or no longer exists');
		this.name = 'AdapterConsumeConflictError';
	}
}

type OAuthDatabase = NodePgDatabase<typeof schema>;

const SENSITIVE_BEARER_MODELS = new Set([
	'AccessToken',
	'AuthorizationCode',
	'RefreshToken',
	'InitialAccessToken',
	'RegistrationAccessToken',
	'DeviceCode',
	'BackchannelAuthenticationRequest',
	'PreAuthorizedCode'
]);

function hashLookupValue(value: string): string {
	return createHash('sha256').update(value, 'utf8').digest('hex');
}

export class PostgresOAuthAdapter implements Adapter {
	constructor(
		private readonly model: string,
		private readonly db: OAuthDatabase,
		private readonly now: () => Date = () => new Date()
	) {}

	async upsert(
		id: string,
		payload: AdapterPayload,
		expiresIn?: number
	): Promise<void> {
		const now = this.now();
		const storedPayload = { ...(payload as Record<string, unknown>) };
		if (SENSITIVE_BEARER_MODELS.has(this.model)) {
			delete storedPayload.jti;
		}
		const values = {
			model: this.model,
			idHash: hashLookupValue(id),
			payload: storedPayload,
			grantIdHash: payload.grantId ? hashLookupValue(payload.grantId) : null,
			userCodeHash: payload.userCode ? hashLookupValue(payload.userCode) : null,
			uid: payload.uid ?? null,
			expiresAt:
				typeof expiresIn === 'number'
					? new Date(now.getTime() + expiresIn * 1000)
					: null,
			consumedAt: null,
			updatedAt: now
		};

		await this.db
			.insert(oauthArtifacts)
			.values(values)
			.onConflictDoUpdate({
				target: [oauthArtifacts.model, oauthArtifacts.idHash],
				set: values
			});
	}

	async find(id: string): Promise<AdapterPayload | undefined> {
		return this.findWhere(
			eq(oauthArtifacts.idHash, hashLookupValue(id)),
			SENSITIVE_BEARER_MODELS.has(this.model) ? id : undefined
		);
	}

	async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
		return this.findWhere(
			eq(oauthArtifacts.userCodeHash, hashLookupValue(userCode))
		);
	}

	async findByUid(uid: string): Promise<AdapterPayload | undefined> {
		return this.findWhere(eq(oauthArtifacts.uid, uid));
	}

	async consume(id: string): Promise<void> {
		const consumedAt = this.now();
		const rows = await this.db
			.update(oauthArtifacts)
			.set({ consumedAt, updatedAt: consumedAt })
			.where(
				and(
					eq(oauthArtifacts.model, this.model),
					eq(oauthArtifacts.idHash, hashLookupValue(id)),
					isNull(oauthArtifacts.consumedAt)
				)
			)
			.returning({ idHash: oauthArtifacts.idHash });

		if (rows.length !== 1) {
			throw new AdapterConsumeConflictError();
		}
	}

	async destroy(id: string): Promise<void> {
		await this.db
			.delete(oauthArtifacts)
			.where(
				and(
					eq(oauthArtifacts.model, this.model),
					eq(oauthArtifacts.idHash, hashLookupValue(id))
				)
			);
	}

	async revokeByGrantId(grantId: string): Promise<void> {
		await this.db
			.delete(oauthArtifacts)
			.where(
				and(
					eq(oauthArtifacts.model, this.model),
					eq(oauthArtifacts.grantIdHash, hashLookupValue(grantId))
				)
			);
	}

	private async findWhere(
		lookup: SQL<unknown>,
		bearerId?: string
	): Promise<AdapterPayload | undefined> {
		const now = this.now();
		const rows = await this.db
			.select({
				payload: oauthArtifacts.payload,
				consumedAt: oauthArtifacts.consumedAt
			})
			.from(oauthArtifacts)
			.where(
				and(
					eq(oauthArtifacts.model, this.model),
					lookup,
					or(
						isNull(oauthArtifacts.expiresAt),
						gt(oauthArtifacts.expiresAt, now)
					)
				)
			)
			.limit(1);
		const row = rows[0];
		if (!row) {
			return undefined;
		}

		return {
			...(row.payload as AdapterPayload),
			...(bearerId ? { jti: bearerId } : {}),
			...(row.consumedAt
				? { consumed: Math.floor(row.consumedAt.getTime() / 1000) }
				: {})
		};
	}
}

export class PostgresOAuthClientAdapter implements Adapter {
	constructor(
		private readonly db: OAuthDatabase,
		private readonly now: () => Date = () => new Date()
	) {}

	async upsert(id: string, payload: AdapterPayload): Promise<void> {
		const metadata = payload as Record<string, unknown>;
		const authMethod = String(
			metadata.token_endpoint_auth_method ?? 'client_secret_basic'
		);
		const clientType = authMethod === 'none' ? 'public' : 'confidential';
		const scope = typeof metadata.scope === 'string' ? metadata.scope : '';
		const allowedScopes = scope.split(' ').filter(Boolean);
		const allowedResources = Array.isArray(metadata.allowed_resources)
			? metadata.allowed_resources.filter(
					(resource): resource is string => typeof resource === 'string'
				)
			: [];
		const redirectUris = Array.isArray(metadata.redirect_uris)
			? metadata.redirect_uris.filter(
					(uri): uri is string => typeof uri === 'string'
				)
			: [];
		const clientSecretHash =
			typeof metadata.client_secret === 'string'
				? metadata.client_secret
				: null;
		const storedMetadata = { ...metadata };
		delete storedMetadata.client_secret;
		const now = this.now();
		const values = {
			id,
			name:
				typeof metadata.client_name === 'string' ? metadata.client_name : id,
			clientType,
			tokenEndpointAuthMethod: authMethod,
			redirectUris,
			allowedScopes,
			allowedResources,
			clientSecretHash,
			secretCreatedAt: clientSecretHash ? now : null,
			dynamic: typeof metadata.client_id_issued_at === 'number',
			metadata: storedMetadata,
			disabledAt: null,
			updatedAt: now
		};

		await this.db.insert(oauthClients).values(values).onConflictDoUpdate({
			target: oauthClients.id,
			set: values
		});
	}

	async find(id: string): Promise<AdapterPayload | undefined> {
		const rows = await this.db
			.select()
			.from(oauthClients)
			.where(and(eq(oauthClients.id, id), isNull(oauthClients.disabledAt)))
			.limit(1);
		const client = rows[0];
		if (!client) {
			return undefined;
		}

		return {
			...(client.metadata as AdapterPayload),
			client_id: client.id,
			client_name: client.name,
			redirect_uris: client.redirectUris,
			token_endpoint_auth_method: client.tokenEndpointAuthMethod,
			scope: client.allowedScopes.join(' '),
			allowed_resources: client.allowedResources,
			...(client.clientSecretHash
				? { client_secret: client.clientSecretHash }
				: {})
		} as AdapterPayload;
	}

	async destroy(id: string): Promise<void> {
		await this.db.delete(oauthClients).where(eq(oauthClients.id, id));
	}

	async consume(): Promise<void> {
		throw new TypeError('Client records cannot be consumed');
	}

	async findByUserCode(): Promise<undefined> {
		return undefined;
	}

	async findByUid(): Promise<undefined> {
		return undefined;
	}

	async revokeByGrantId(): Promise<void> {}
}

export function createPostgresAdapterFactory(db: OAuthDatabase) {
	return (model: string): Adapter =>
		model === 'Client'
			? new PostgresOAuthClientAdapter(db)
			: new PostgresOAuthAdapter(model, db);
}
