import Provider, {
	errors,
	type Account,
	type AdapterFactory,
	type Client,
	type Configuration,
	type JWKS
} from 'oidc-provider';
import { verifyClientSecret } from './client-secret.js';

export type OAuthProvider = Provider;

export const OAUTH_SCOPES = [
	'openid',
	'email',
	'profile',
	'offline_access',
	'vocab:read',
	'vocab:write',
	'mcp:tools'
] as const;

export interface SigningKeyProvider {
	loadPrivateJwks(): Promise<JWKS>;
}

export interface OAuthAccountProvider {
	findAccount(accountId: string): Promise<Account | undefined>;
}

export type OAuthResource = {
	uri: string;
	allowedScopes: string[];
};

export interface OAuthResourceProvider {
	findResource(uri: string): Promise<OAuthResource | undefined>;
}

export type CreateOAuthProviderOptions = {
	issuer: string;
	adapter: AdapterFactory;
	signingKeyProvider: SigningKeyProvider;
	accountProvider: OAuthAccountProvider;
	resourceProvider: OAuthResourceProvider;
	interactionUrl: (uid: string) => string;
	dynamicClientRegistration: {
		enabled: boolean;
		allowedResources: string[];
		allowedScopes: string[];
	};
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function assertSafeRedirectUris(
	metadata: Record<string, unknown>
): void {
	const redirectUris = metadata.redirect_uris;
	if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
		throw new errors.InvalidClientMetadata(
			'redirect_uris must contain at least one URI'
		);
	}

	for (const value of redirectUris) {
		if (typeof value !== 'string' || value.includes('*')) {
			throw new errors.InvalidClientMetadata(
				'redirect_uris must contain exact URIs without wildcards'
			);
		}
		let uri: URL;
		try {
			uri = new URL(value);
		} catch {
			throw new errors.InvalidClientMetadata(
				'redirect_uris must contain valid URIs'
			);
		}
		if (uri.hash || uri.username || uri.password) {
			throw new errors.InvalidClientMetadata(
				'redirect_uris cannot contain fragments or user information'
			);
		}
		const isHttps = uri.protocol === 'https:';
		const isLoopbackHttp =
			uri.protocol === 'http:' && LOOPBACK_HOSTS.has(uri.hostname);
		if (!isHttps && !isLoopbackHttp) {
			throw new errors.InvalidClientMetadata(
				'redirect_uris must use HTTPS except for local loopback development'
			);
		}
	}
}

export async function createOAuthProvider(
	options: CreateOAuthProviderOptions
): Promise<Provider> {
	const jwks = await options.signingKeyProvider.loadPrivateJwks();
	const configuration: Configuration = {
		adapter: options.adapter,
		jwks,
		scopes: OAUTH_SCOPES,
		responseTypes: ['code'],
		clientAuthMethods: ['none', 'client_secret_basic'],
		clientDefaults: {
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			token_endpoint_auth_method: 'none',
			id_token_signed_response_alg: 'ES256'
		},
		claims: {
			openid: ['sub'],
			email: ['email', 'email_verified'],
			profile: ['name']
		},
		enabledJWA: {
			idTokenSigningAlgValues: ['ES256'],
			userinfoSigningAlgValues: ['ES256']
		},
		pkce: { required: () => true },
		ttl: {
			AccessToken: 15 * 60,
			AuthorizationCode: 5 * 60,
			IdToken: 15 * 60,
			RefreshToken: 30 * 24 * 60 * 60,
			Interaction: 60 * 60,
			Session: 14 * 24 * 60 * 60,
			Grant: 30 * 24 * 60 * 60
		},
		rotateRefreshToken: true,
		issueRefreshToken: (_ctx, client, code) =>
			client.grantTypeAllowed('refresh_token') &&
			code.scopes.has('offline_access'),
		findAccount: (_ctx, accountId) =>
			options.accountProvider.findAccount(accountId),
		interactions: {
			url: (_ctx, interaction) => options.interactionUrl(interaction.uid)
		},
		routes: {
			authorization: '/oauth/authorize',
			token: '/oauth/token',
			registration: '/oauth/register',
			revocation: '/oauth/revoke',
			userinfo: '/oauth/userinfo',
			jwks: '/.well-known/jwks.json'
		},
		features: {
			devInteractions: { enabled: false },
			clientCredentials: { enabled: false },
			deviceFlow: { enabled: false },
			introspection: { enabled: false },
			revocation: { enabled: true },
			pushedAuthorizationRequests: { enabled: false },
			registration: {
				enabled: options.dynamicClientRegistration.enabled,
				initialAccessToken: false,
				issueRegistrationAccessToken: false
			},
			registrationManagement: { enabled: false },
			resourceIndicators: {
				enabled: true,
				defaultResource: async (_ctx, client, requested) => {
					if (requested?.length === 1) {
						return requested[0];
					}
					if (requested) {
						return requested;
					}
					const metadata = client.metadata() as Record<string, unknown>;
					const allowedResources = Array.isArray(metadata.allowed_resources)
						? metadata.allowed_resources.filter(
								(resource): resource is string => typeof resource === 'string'
							)
						: [];
					if (allowedResources.length === 1) {
						return allowedResources[0];
					}
					throw new errors.InvalidTarget(
						'A single resource indicator is required'
					);
				},
				useGrantedResource: () => true,
				getResourceServerInfo: async (_ctx, resourceUri, client) => {
					const metadata = client.metadata() as Record<string, unknown>;
					const allowedResources = Array.isArray(metadata.allowed_resources)
						? metadata.allowed_resources
						: [];
					const resource =
						await options.resourceProvider.findResource(resourceUri);
					if (!resource || !allowedResources.includes(resourceUri)) {
						throw new errors.InvalidTarget(
							'The requested resource is not allowed for this client'
						);
					}
					return {
						scope: resource.allowedScopes.join(' '),
						audience: resource.uri,
						accessTokenTTL: 15 * 60,
						accessTokenFormat: 'jwt',
						jwt: { sign: { alg: 'ES256' } }
					};
				}
			}
		},
		extraClientMetadata: {
			properties: ['allowed_resources'],
			validator: (ctx, key, _value, metadata) => {
				if (key !== 'allowed_resources') {
					return;
				}
				assertSafeRedirectUris(metadata as Record<string, unknown>);
				if (
					ctx?.path === '/oauth/register' &&
					metadata.token_endpoint_auth_method !== 'none'
				) {
					throw new errors.InvalidClientMetadata(
						'Dynamic registration only accepts public clients'
					);
				}
				if (ctx?.path === '/oauth/register') {
					const requestedResources = Array.isArray(metadata.allowed_resources)
						? metadata.allowed_resources
						: options.dynamicClientRegistration.allowedResources;
					if (
						requestedResources.some(
							(resource) =>
								typeof resource !== 'string' ||
								!options.dynamicClientRegistration.allowedResources.includes(
									resource
								)
						)
					) {
						throw new errors.InvalidClientMetadata(
							'Dynamic client requested an unsupported resource'
						);
					}
					metadata.allowed_resources = requestedResources;

					const requestedScopes =
						typeof metadata.scope === 'string'
							? metadata.scope.split(' ').filter(Boolean)
							: options.dynamicClientRegistration.allowedScopes;
					if (
						requestedScopes.some(
							(scope) =>
								!options.dynamicClientRegistration.allowedScopes.includes(scope)
						)
					) {
						throw new errors.InvalidClientMetadata(
							'Dynamic client requested an unsupported scope'
						);
					}
					metadata.scope = requestedScopes.join(' ');
				}
			}
		}
	};

	const provider = new Provider(options.issuer, configuration);
	provider.proxy = true;
	provider.Client.prototype.compareClientSecret = function compareHashedSecret(
		this: Client,
		actual: string
	) {
		if (!this.clientSecret) {
			return false;
		}
		return verifyClientSecret(actual, this.clientSecret);
	};
	return provider;
}
