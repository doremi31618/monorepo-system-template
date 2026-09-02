import { Inject, Injectable } from '@nestjs/common';
import {
	OAuthError,
	OAuthErrorCode,
	type AuthInfo,
	type OAuthTokenVerifier
} from '@platform/nest-infra-mcp-server';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import {
	MCP_RUNTIME_CONFIG,
	type McpRuntimeConfig
} from './mcp.constants.js';

@Injectable()
export class McpAccessTokenVerifier implements OAuthTokenVerifier {
	private readonly issuer: string;
	private readonly resource: URL;
	private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

	constructor(
		@Inject(MCP_RUNTIME_CONFIG) config: McpRuntimeConfig
	) {
		this.issuer = config.issuer;
		this.resource = new URL(config.privateResourceUri);
		this.jwks = createRemoteJWKSet(
			new URL('/.well-known/jwks.json', this.issuer)
		);
	}

	async verifyAccessToken(token: string): Promise<AuthInfo> {
		try {
			const payload = await this.verifyJwt(token);
			return this.toAuthInfo(token, payload);
		} catch {
			throw new OAuthError(
				OAuthErrorCode.InvalidToken,
				'The access token is invalid for this MCP resource'
			);
		}
	}

	private async verifyJwt(token: string): Promise<JWTPayload> {
		const { payload } = await jwtVerify(token, this.jwks, {
			issuer: this.issuer,
			audience: this.resource.href,
			algorithms: ['ES256']
		});
		return payload;
	}

	private toAuthInfo(token: string, payload: JWTPayload): AuthInfo {
		const subject = Number(payload.sub);
		const clientId = payload.client_id;

		if (
			!Number.isSafeInteger(subject) ||
			subject <= 0 ||
			typeof clientId !== 'string' ||
			clientId.length === 0 ||
			typeof payload.exp !== 'number'
		) {
			throw new Error('Required access-token claims are missing');
		}

		return {
			token,
			clientId,
			scopes:
				typeof payload.scope === 'string'
					? payload.scope.split(' ').filter(Boolean)
					: [],
			expiresAt: payload.exp,
			resource: this.resource,
			extra: { userId: subject }
		};
	}
}
