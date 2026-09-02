import { OAuthError, OAuthErrorCode } from '@platform/nest-infra-mcp-server';
import { createServer, type Server } from 'node:http';
import { SignJWT, exportJWK, generateKeyPair, type CryptoKey } from 'jose';
import { McpAccessTokenVerifier } from './mcp-access-token-verifier.service.js';

describe('McpAccessTokenVerifier', () => {
	let issuer: string;
	let signingKey: CryptoKey;
	let jwksServer: Server;

	beforeAll(async () => {
		const { publicKey, privateKey } = await generateKeyPair('ES256', {
			extractable: true
		});
		signingKey = privateKey;
		const publicJwk = await exportJWK(publicKey);
		Object.assign(publicJwk, { kid: 'test-key', alg: 'ES256', use: 'sig' });
		jwksServer = createServer((_request, response) => {
			response.setHeader('Content-Type', 'application/json');
			response.end(JSON.stringify({ keys: [publicJwk] }));
		});
		await new Promise<void>((resolve) =>
			jwksServer.listen(0, '127.0.0.1', resolve)
		);
		const address = jwksServer.address();
		if (!address || typeof address === 'string') {
			throw new Error('JWKS test server did not bind a TCP port');
		}
		issuer = `http://127.0.0.1:${address.port}`;
	});

	afterAll(async () => {
		await new Promise<void>((resolve, reject) =>
			jwksServer.close((error) => (error ? reject(error) : resolve()))
		);
	});

	it('maps validated OAuth JWT claims to MCP AuthInfo', async () => {
		const verifier = createVerifier();
		jest.spyOn(verifier as any, 'verifyJwt').mockResolvedValue({
			sub: '42',
			client_id: 'chatgpt-client',
			scope: 'openid mcp:tools',
			exp: Math.floor(Date.now() / 1000) + 900
		});

		await expect(
			verifier.verifyAccessToken('signed-token')
		).resolves.toMatchObject({
			token: 'signed-token',
			clientId: 'chatgpt-client',
			scopes: ['openid', 'mcp:tools'],
			resource: new URL('https://api.example.com/mcp/private'),
			extra: { userId: 42 }
		});
	});

	it('converts invalid signatures, audiences, or required claims to invalid_token', async () => {
		const verifier = createVerifier();
		jest
			.spyOn(verifier as any, 'verifyJwt')
			.mockRejectedValue(new Error('unexpected audience'));

		await expect(
			verifier.verifyAccessToken('wrong-token')
		).rejects.toMatchObject({
			code: OAuthErrorCode.InvalidToken
		} satisfies Partial<OAuthError>);
	});

	it('cryptographically enforces issuer, ES256 signature, expiry, and exact audience', async () => {
		const verifier = createVerifier(issuer);
		const valid = await tokenFor('https://api.example.com/mcp/private');
		const wrongAudience = await tokenFor('https://api.example.com/mcp/public');

		await expect(verifier.verifyAccessToken(valid)).resolves.toMatchObject({
			clientId: 'integration-client',
			extra: { userId: 42 }
		});
		await expect(
			verifier.verifyAccessToken(wrongAudience)
		).rejects.toMatchObject({
			code: OAuthErrorCode.InvalidToken
		});
	});

	function tokenFor(audience: string) {
		return new SignJWT({
			client_id: 'integration-client',
			scope: 'mcp:tools'
		})
			.setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
			.setIssuer(issuer)
			.setSubject('42')
			.setAudience(audience)
			.setIssuedAt()
			.setExpirationTime('15m')
			.sign(signingKey);
	}

	function createVerifier(oauthIssuer = 'https://auth.example.com') {
		return new McpAccessTokenVerifier({
			issuer: oauthIssuer,
			privateResourceUri: 'https://api.example.com/mcp/private'
		});
	}
});
