import { Module } from '@nestjs/common';
import { AuthModule } from '@platform/auth';
import { IUserService, UserModule } from '@platform/users';
import {
	createOAuthProvider,
	createPostgresAdapterFactory,
	EphemeralDevelopmentSigningKeyProvider,
	JsonSigningKeyProvider,
	OAuthInteractionService,
	PostgresOAuthAudit,
	PostgresOAuthResourceProvider
} from '@platform/oauth-server';
import type { DB } from '../core/infra/db/db.js';
import { OAuthInteractionController } from './oauth-interaction.controller.js';
import { OAUTH_PROVIDER } from './oauth.constants.js';

function csv(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

@Module({
	imports: [AuthModule, UserModule],
	controllers: [OAuthInteractionController],
	providers: [
		{
			provide: OAUTH_PROVIDER,
			inject: ['DB', IUserService],
			useFactory: async (db: DB, users: IUserService) => {
				const privateJwks = process.env.OAUTH_PRIVATE_JWKS;
				const signingKeyProvider = privateJwks
					? new JsonSigningKeyProvider(privateJwks)
					: process.env.NODE_ENV !== 'prd'
						? new EphemeralDevelopmentSigningKeyProvider()
						: (() => {
								throw new Error('OAUTH_PRIVATE_JWKS is required in production');
							})();

				const provider = await createOAuthProvider({
					issuer: process.env.OAUTH_ISSUER ?? 'http://localhost:3333',
					adapter: createPostgresAdapterFactory(db),
					signingKeyProvider,
					accountProvider: {
						findAccount: async (accountId) => {
							const user = await users.getUserById(Number(accountId));
							if (!user) return undefined;
							return {
								accountId,
								claims: async () => ({
									sub: accountId,
									email: user.email,
									email_verified: true,
									name: user.name
								})
							};
						}
					},
					resourceProvider: new PostgresOAuthResourceProvider(db),
					interactionUrl: (uid) =>
						`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/oauth/interaction/${encodeURIComponent(uid)}`,
					dynamicClientRegistration: {
						enabled: process.env.OAUTH_DCR_ENABLED !== 'false',
						allowedResources: csv(process.env.OAUTH_DCR_RESOURCES),
						allowedScopes: csv(process.env.OAUTH_DCR_SCOPES)
					}
				});
				const audit = new PostgresOAuthAudit(db);
				const record = (
					eventType: string,
					outcome: 'success' | 'failure',
					ctx: any,
					details: Record<string, unknown> = {}
				) => {
					void audit
						.record({
							eventType,
							outcome,
							actorId: ctx?.oidc?.account?.accountId,
							clientId: ctx?.oidc?.client?.clientId,
							resourceUri:
								typeof ctx?.oidc?.params?.resource === 'string'
									? ctx.oidc.params.resource
									: undefined,
							ipAddress: ctx?.ip,
							userAgent: ctx?.get?.('user-agent'),
							details
						})
						.catch(() => undefined);
				};
				provider.on('authorization.success', (ctx) =>
					record('authorization.success', 'success', ctx)
				);
				provider.on('authorization.error', (ctx, error) =>
					record('authorization.error', 'failure', ctx, {
						error: error.message
					})
				);
				provider.on('grant.success', (ctx) =>
					record('token.success', 'success', ctx)
				);
				provider.on('grant.error', (ctx, error) =>
					record('token.error', 'failure', ctx, { error: error.message })
				);
				provider.on('refresh_token.consumed', (token) => {
					void audit
						.record({
							eventType: 'refresh_token.consumed',
							outcome: 'success',
							actorId: token.accountId,
							clientId: token.clientId,
							details: { grantId: token.grantId }
						})
						.catch(() => undefined);
				});
				provider.on('grant.revoked', (ctx, grantId) =>
					record('grant.revoked', 'success', ctx, { grantId })
				);
				provider.on('registration_create.success', (ctx, client) =>
					record('registration.success', 'success', ctx, {
						clientId: client.clientId
					})
				);
				provider.on('registration_create.error', (ctx, error) =>
					record('registration.error', 'failure', ctx, {
						error: error.message
					})
				);
				return provider;
			}
		},
		{
			provide: OAuthInteractionService,
			inject: [OAUTH_PROVIDER],
			useFactory: (provider) => new OAuthInteractionService(provider)
		}
	],
	exports: [OAUTH_PROVIDER]
})
export class OAuthModule {}
