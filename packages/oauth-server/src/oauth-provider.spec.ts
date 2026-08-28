import request from 'supertest';
import { exportJWK, generateKeyPair } from 'jose';
import type { Adapter, AdapterPayload } from 'oidc-provider';
import {
	assertSafeRedirectUris,
	createOAuthProvider
} from './oauth-provider.js';

class TestAdapter implements Adapter {
	private readonly values = new Map<string, AdapterPayload>();

	async upsert(id: string, payload: AdapterPayload) {
		this.values.set(id, payload);
	}
	async find(id: string) {
		return this.values.get(id);
	}
	async findByUserCode() {
		return undefined;
	}
	async findByUid() {
		return undefined;
	}
	async consume(id: string) {
		const value = this.values.get(id);
		if (value) value.consumed = Math.floor(Date.now() / 1000);
	}
	async destroy(id: string) {
		this.values.delete(id);
	}
	async revokeByGrantId() {}
}

describe('createOAuthProvider', () => {
	it('allows HTTPS and localhost callbacks but rejects unsafe redirect URIs', () => {
		expect(() =>
			assertSafeRedirectUris({
				redirect_uris: [
					'https://vocab.example/auth/callback',
					'http://127.0.0.1:4321/callback'
				]
			})
		).not.toThrow();
		expect(() =>
			assertSafeRedirectUris({
				redirect_uris: ['http://vocab.example/auth/callback']
			})
		).toThrow();
		expect(() =>
			assertSafeRedirectUris({
				redirect_uris: ['https://*.example.com/callback']
			})
		).toThrow();
	});

	it('publishes the OAuth 2.1 endpoints and only the supported flow', async () => {
		const { privateKey } = await generateKeyPair('ES256', {
			extractable: true
		});
		const privateJwk = await exportJWK(privateKey);
		privateJwk.kid = 'test-signing-key';
		privateJwk.use = 'sig';
		privateJwk.alg = 'ES256';
		const provider = await createOAuthProvider({
			issuer: 'https://auth.example.com',
			adapter: () => new TestAdapter(),
			signingKeyProvider: {
				loadPrivateJwks: async () => ({ keys: [privateJwk] })
			},
			accountProvider: {
				findAccount: async (accountId) => ({
					accountId,
					claims: async () => ({ sub: accountId })
				})
			},
			resourceProvider: {
				findResource: async () => undefined
			},
			interactionUrl: (uid) =>
				`https://app.example.com/oauth/interaction/${uid}`,
			dynamicClientRegistration: {
				enabled: true,
				allowedResources: ['https://mcp.example/mcp'],
				allowedScopes: ['openid', 'offline_access', 'mcp:tools']
			}
		});

		const response = await request(provider.callback())
			.get('/.well-known/openid-configuration')
			.set('host', 'auth.example.com')
			.set('x-forwarded-proto', 'https');

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			authorization_endpoint: 'https://auth.example.com/oauth/authorize',
			token_endpoint: 'https://auth.example.com/oauth/token',
			registration_endpoint: 'https://auth.example.com/oauth/register',
			revocation_endpoint: 'https://auth.example.com/oauth/revoke',
			userinfo_endpoint: 'https://auth.example.com/oauth/userinfo',
			jwks_uri: 'https://auth.example.com/.well-known/jwks.json',
			response_types_supported: ['code']
		});
		expect(response.body.grant_types_supported).toEqual([
			'authorization_code',
			'refresh_token'
		]);
		expect(response.body.code_challenge_methods_supported).toEqual(['S256']);
		expect(response.body.token_endpoint_auth_methods_supported).toEqual(
			expect.arrayContaining(['none', 'client_secret_basic'])
		);

		const registration = await request(provider.callback())
			.post('/oauth/register')
			.set('host', 'auth.example.com')
			.set('x-forwarded-proto', 'https')
			.send({
				client_name: 'ChatGPT',
				redirect_uris: ['https://chatgpt.com/connector/oauth/callback'],
				token_endpoint_auth_method: 'none',
				grant_types: ['authorization_code', 'refresh_token'],
				response_types: ['code'],
				scope: 'openid offline_access mcp:tools'
			});

		expect(registration.status).toBe(201);
		expect(registration.body.client_secret).toBeUndefined();
		expect(registration.body.allowed_resources).toEqual([
			'https://mcp.example/mcp'
		]);
	});
});
