import type { IncomingMessage, ServerResponse } from 'node:http';
import Provider from 'oidc-provider';

function stringArray(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}
	return typeof value === 'string' ? [value] : [];
}

export class OAuthInteractionService {
	constructor(private readonly provider: Provider) {}

	async getDetails(req: IncomingMessage, res: ServerResponse) {
		const interaction = await this.provider.interactionDetails(req, res);
		const clientId = String(interaction.params.client_id ?? '');
		const client = await this.provider.Client.find(clientId);
		const resource = interaction.params.resource;
		const scopes =
			typeof interaction.params.scope === 'string'
				? interaction.params.scope.split(' ').filter(Boolean)
				: [];

		return {
			uid: interaction.uid,
			prompt: interaction.prompt.name,
			client: {
				id: clientId,
				name: client?.clientName ?? clientId
			},
			redirectUri: String(interaction.params.redirect_uri ?? ''),
			resources: stringArray(resource),
			scopes,
			authenticated: Boolean(interaction.session?.accountId)
		};
	}

	async finishLogin(
		req: IncomingMessage,
		res: ServerResponse,
		accountId: string
	): Promise<string> {
		return this.provider.interactionResult(
			req,
			res,
			{
				login: {
					accountId,
					acr: 'urn:platform:loa:1',
					amr: ['pwd'],
					remember: true
				}
			},
			{ mergeWithLastSubmission: false }
		);
	}

	async finishConsent(
		req: IncomingMessage,
		res: ServerResponse,
		expectedAccountId?: string
	): Promise<string> {
		const interaction = await this.provider.interactionDetails(req, res);
		const accountId = interaction.session?.accountId;
		const clientId = String(interaction.params.client_id ?? '');
		if (!accountId || !clientId) {
			throw new Error('OAuth consent requires an authenticated interaction');
		}
		if (expectedAccountId && accountId !== expectedAccountId) {
			throw new Error('OAuth interaction account does not match the session');
		}

		let grant = interaction.grantId
			? await this.provider.Grant.find(interaction.grantId)
			: undefined;
		grant ??= new this.provider.Grant({ accountId, clientId });
		const details = interaction.prompt.details as Record<string, unknown>;
		const missingOidcScopes = stringArray(details.missingOIDCScope);
		if (missingOidcScopes.length > 0) {
			grant.addOIDCScope(missingOidcScopes);
		}
		const missingOidcClaims = stringArray(details.missingOIDCClaims);
		if (missingOidcClaims.length > 0) {
			grant.addOIDCClaims(missingOidcClaims);
		}
		const missingResourceScopes = details.missingResourceScopes;
		if (
			missingResourceScopes &&
			typeof missingResourceScopes === 'object' &&
			!Array.isArray(missingResourceScopes)
		) {
			for (const [resource, scopes] of Object.entries(missingResourceScopes)) {
				grant.addResourceScope(resource, stringArray(scopes));
			}
		}
		const grantId = await grant.save();

		return this.provider.interactionResult(
			req,
			res,
			{ consent: { grantId } },
			{ mergeWithLastSubmission: true }
		);
	}

	async deny(
		req: IncomingMessage,
		res: ServerResponse,
		expectedAccountId?: string
	): Promise<string> {
		if (expectedAccountId) {
			const interaction = await this.provider.interactionDetails(req, res);
			if (interaction.session?.accountId !== expectedAccountId) {
				throw new Error('OAuth interaction account does not match the session');
			}
		}
		return this.provider.interactionResult(
			req,
			res,
			{
				error: 'access_denied',
				error_description: 'The resource owner denied the request'
			},
			{ mergeWithLastSubmission: false }
		);
	}
}
