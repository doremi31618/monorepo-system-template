import { authorizeResourceAccess } from './resource-policy.js';

describe('authorizeResourceAccess', () => {
	it('authorizes one registered resource with scopes allowed to both the client and resource', () => {
		expect(
			authorizeResourceAccess({
				requestedResource: 'https://vocab.example/api',
				requestedScopes: ['openid', 'vocab:read'],
				client: {
					allowedResources: ['https://vocab.example/api'],
					allowedScopes: ['openid', 'profile', 'vocab:read']
				},
				resource: {
					uri: 'https://vocab.example/api',
					allowedScopes: ['vocab:read', 'vocab:write']
				}
			})
		).toEqual({
			audience: 'https://vocab.example/api',
			scopes: ['openid', 'vocab:read']
		});
	});

	it('rejects a resource that is not registered for the client', () => {
		expect(() =>
			authorizeResourceAccess({
				requestedResource: 'https://mcp.example/mcp',
				requestedScopes: ['mcp:tools'],
				client: {
					allowedResources: ['https://vocab.example/api'],
					allowedScopes: ['mcp:tools']
				},
				resource: {
					uri: 'https://mcp.example/mcp',
					allowedScopes: ['mcp:tools']
				}
			})
		).toThrow(expect.objectContaining({ code: 'invalid_target' }));
	});

	it('rejects a scope that is not allowed by the target resource', () => {
		expect(() =>
			authorizeResourceAccess({
				requestedResource: 'https://vocab.example/api',
				requestedScopes: ['openid', 'mcp:tools'],
				client: {
					allowedResources: ['https://vocab.example/api'],
					allowedScopes: ['openid', 'mcp:tools']
				},
				resource: {
					uri: 'https://vocab.example/api',
					allowedScopes: ['vocab:read', 'vocab:write']
				}
			})
		).toThrow(expect.objectContaining({ code: 'invalid_scope' }));
	});
});
