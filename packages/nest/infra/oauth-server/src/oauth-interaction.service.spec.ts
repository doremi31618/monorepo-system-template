import { OAuthInteractionService } from './oauth-interaction.service.js';

describe('OAuthInteractionService', () => {
	it('exposes the client, exact callback, resource, and scopes for consent UI', async () => {
		const provider = {
			interactionDetails: jest.fn().mockResolvedValue({
				uid: 'interaction-1',
				prompt: {
					name: 'consent',
					reasons: ['scopes_missing'],
					details: { missingOIDCScope: ['openid'] }
				},
				params: {
					client_id: 'vocab-web',
					redirect_uri: 'https://vocab.example/auth/callback',
					resource: 'https://vocab.example/api',
					scope: 'openid vocab:read'
				},
				session: { accountId: '42' }
			}),
			Client: {
				find: jest.fn().mockResolvedValue({
					clientId: 'vocab-web',
					clientName: 'Vocab'
				})
			}
		};
		const service = new OAuthInteractionService(provider as never);

		await expect(service.getDetails({} as never, {} as never)).resolves.toEqual(
			{
				uid: 'interaction-1',
				prompt: 'consent',
				client: { id: 'vocab-web', name: 'Vocab' },
				redirectUri: 'https://vocab.example/auth/callback',
				resources: ['https://vocab.example/api'],
				scopes: ['openid', 'vocab:read'],
				authenticated: true
			}
		);
	});
});
