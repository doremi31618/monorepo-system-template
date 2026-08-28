import type { JWKS } from 'oidc-provider';
import { exportJWK, generateKeyPair } from 'jose';
import type { SigningKeyProvider } from './oauth-provider.js';

export class JsonSigningKeyProvider implements SigningKeyProvider {
	constructor(private readonly serializedJwks: string) {}

	async loadPrivateJwks(): Promise<JWKS> {
		let parsed: unknown;
		try {
			parsed = JSON.parse(this.serializedJwks);
		} catch (cause) {
			throw new TypeError('OAUTH_PRIVATE_JWKS must be valid JSON', { cause });
		}
		if (
			!parsed ||
			typeof parsed !== 'object' ||
			!('keys' in parsed) ||
			!Array.isArray(parsed.keys) ||
			parsed.keys.length === 0
		) {
			throw new TypeError('OAUTH_PRIVATE_JWKS must contain at least one key');
		}
		for (const key of parsed.keys) {
			if (
				!key ||
				typeof key !== 'object' ||
				key.kty !== 'EC' ||
				key.crv !== 'P-256' ||
				key.alg !== 'ES256' ||
				typeof key.kid !== 'string' ||
				typeof key.d !== 'string'
			) {
				throw new TypeError(
					'Every OAuth signing key must be a private ES256 JWK with a kid'
				);
			}
		}
		return parsed as JWKS;
	}
}

export class EphemeralDevelopmentSigningKeyProvider implements SigningKeyProvider {
	async loadPrivateJwks(): Promise<JWKS> {
		const { privateKey } = await generateKeyPair('ES256', {
			extractable: true
		});
		const key = await exportJWK(privateKey);
		return {
			keys: [
				{
					...key,
					kid: `development-${Date.now()}`,
					use: 'sig',
					alg: 'ES256'
				}
			]
		} as JWKS;
	}
}
