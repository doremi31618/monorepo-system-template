import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { hashClientSecret } from './client-secret.js';
import { PostgresOAuthAudit } from './oauth-audit.js';
import { assertSafeRedirectUris, OAUTH_SCOPES } from './oauth-provider.js';
import { oauthClients, oauthResources } from './oauth-server.schema.js';
import type * as schema from './oauth-server.schema.js';

type OAuthDatabase = NodePgDatabase<typeof schema>;

export type CreateOAuthResourceInput = {
	uri: string;
	name: string;
	allowedScopes: string[];
};

export type CreateOAuthClientInput = {
	id: string;
	name: string;
	clientType: 'public' | 'confidential';
	redirectUris: string[];
	allowedScopes: string[];
	allowedResources: string[];
};

export class OAuthAdminService {
	constructor(
		private readonly db: OAuthDatabase,
		private readonly audit = new PostgresOAuthAudit(db),
		private readonly actorId = 'operator'
	) {}

	async createResource(input: CreateOAuthResourceInput) {
		this.assertKnownScopes(input.allowedScopes);
		const [resource] = await this.db
			.insert(oauthResources)
			.values({
				uri: input.uri,
				name: input.name,
				allowedScopes: [...new Set(input.allowedScopes)]
			})
			.returning();
		await this.audit.record({
			eventType: 'resource.created',
			outcome: 'success',
			actorId: this.actorId,
			resourceUri: input.uri
		});
		return resource;
	}

	async listResources() {
		return this.db
			.select()
			.from(oauthResources)
			.orderBy(oauthResources.createdAt);
	}

	async disableResource(uri: string): Promise<boolean> {
		const rows = await this.db
			.update(oauthResources)
			.set({ disabledAt: new Date(), updatedAt: new Date() })
			.where(
				and(eq(oauthResources.uri, uri), isNull(oauthResources.disabledAt))
			)
			.returning({ uri: oauthResources.uri });
		const disabled = rows.length === 1;
		if (disabled) {
			await this.audit.record({
				eventType: 'resource.disabled',
				outcome: 'success',
				actorId: this.actorId,
				resourceUri: uri
			});
		}
		return disabled;
	}

	async createClient(input: CreateOAuthClientInput): Promise<{
		id: string;
		clientSecret?: string;
	}> {
		assertSafeRedirectUris({ redirect_uris: input.redirectUris });
		this.assertKnownScopes(input.allowedScopes);
		await this.assertResourcesExist(input.allowedResources);

		const clientSecret =
			input.clientType === 'confidential'
				? randomBytes(32).toString('base64url')
				: undefined;
		const clientSecretHash = clientSecret
			? await hashClientSecret(clientSecret)
			: null;
		const tokenEndpointAuthMethod = clientSecret
			? 'client_secret_basic'
			: 'none';
		const metadata = {
			client_id: input.id,
			client_name: input.name,
			application_type: 'web',
			redirect_uris: input.redirectUris,
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			token_endpoint_auth_method: tokenEndpointAuthMethod,
			id_token_signed_response_alg: 'ES256',
			scope: input.allowedScopes.join(' '),
			allowed_resources: input.allowedResources
		};

		await this.db.insert(oauthClients).values({
			id: input.id,
			name: input.name,
			clientType: input.clientType,
			tokenEndpointAuthMethod,
			redirectUris: input.redirectUris,
			allowedScopes: [...new Set(input.allowedScopes)],
			allowedResources: [...new Set(input.allowedResources)],
			clientSecretHash,
			secretCreatedAt: clientSecret ? new Date() : null,
			dynamic: false,
			metadata
		});
		await this.audit.record({
			eventType: 'client.created',
			outcome: 'success',
			actorId: this.actorId,
			clientId: input.id,
			details: { clientType: input.clientType }
		});

		return { id: input.id, ...(clientSecret ? { clientSecret } : {}) };
	}

	async listClients() {
		return this.db
			.select({
				id: oauthClients.id,
				name: oauthClients.name,
				clientType: oauthClients.clientType,
				tokenEndpointAuthMethod: oauthClients.tokenEndpointAuthMethod,
				redirectUris: oauthClients.redirectUris,
				allowedScopes: oauthClients.allowedScopes,
				allowedResources: oauthClients.allowedResources,
				dynamic: oauthClients.dynamic,
				disabledAt: oauthClients.disabledAt,
				createdAt: oauthClients.createdAt,
				updatedAt: oauthClients.updatedAt
			})
			.from(oauthClients)
			.orderBy(oauthClients.createdAt);
	}

	async disableClient(id: string): Promise<boolean> {
		const rows = await this.db
			.update(oauthClients)
			.set({ disabledAt: new Date(), updatedAt: new Date() })
			.where(and(eq(oauthClients.id, id), isNull(oauthClients.disabledAt)))
			.returning({ id: oauthClients.id });
		const disabled = rows.length === 1;
		if (disabled) {
			await this.audit.record({
				eventType: 'client.disabled',
				outcome: 'success',
				actorId: this.actorId,
				clientId: id
			});
		}
		return disabled;
	}

	async rotateClientSecret(id: string): Promise<{ clientSecret: string }> {
		const clientSecret = randomBytes(32).toString('base64url');
		const clientSecretHash = await hashClientSecret(clientSecret);
		const rows = await this.db
			.update(oauthClients)
			.set({
				clientSecretHash,
				secretCreatedAt: new Date(),
				updatedAt: new Date()
			})
			.where(
				and(
					eq(oauthClients.id, id),
					eq(oauthClients.clientType, 'confidential'),
					isNull(oauthClients.disabledAt)
				)
			)
			.returning({ id: oauthClients.id });
		if (rows.length !== 1) {
			throw new Error('Enabled confidential OAuth client not found');
		}
		await this.audit.record({
			eventType: 'client.secret_rotated',
			outcome: 'success',
			actorId: this.actorId,
			clientId: id
		});
		return { clientSecret };
	}

	private assertKnownScopes(scopes: string[]): void {
		const supported = new Set<string>(OAUTH_SCOPES);
		const invalid = scopes.find((scope) => !supported.has(scope));
		if (invalid) {
			throw new TypeError(`Unsupported OAuth scope: ${invalid}`);
		}
	}

	private async assertResourcesExist(resources: string[]): Promise<void> {
		if (resources.length === 0) {
			throw new TypeError('OAuth client must be allowed at least one resource');
		}
		const rows = await this.db
			.select({ uri: oauthResources.uri })
			.from(oauthResources)
			.where(
				and(
					inArray(oauthResources.uri, [...new Set(resources)]),
					isNull(oauthResources.disabledAt)
				)
			);
		if (rows.length !== new Set(resources).size) {
			throw new TypeError(
				'OAuth client references an unknown or disabled resource'
			);
		}
	}
}
