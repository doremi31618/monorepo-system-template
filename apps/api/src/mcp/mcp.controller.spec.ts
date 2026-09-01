import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ResponseInterceptor } from '../core/infra/interceptor/response.interceptor.js';
import { McpAccessTokenVerifier } from './mcp-access-token-verifier.service.js';
import { McpCompositionService } from './mcp-composition.service.js';
import { McpController } from './mcp.controller.js';

describe('McpController protocol responses', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			controllers: [McpController],
			providers: [
				{
					provide: McpCompositionService,
					useValue: {
						getProtectedResourceMetadata: () => ({
							resource: 'https://api.example.com/mcp/private',
							authorization_servers: ['https://auth.example.com'],
							scopes_supported: ['mcp:tools']
						})
					}
				},
				{ provide: McpAccessTokenVerifier, useValue: {} }
			]
		}).compile();
		app = module.createNestApplication();
		app.useGlobalInterceptors(new ResponseInterceptor());
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('does not wrap RFC 9728 metadata in the REST response envelope', async () => {
		const response = await request(app.getHttpServer())
			.get('/.well-known/oauth-protected-resource/mcp/private')
			.expect(200);

		expect(response.body).toEqual({
			resource: 'https://api.example.com/mcp/private',
			authorization_servers: ['https://auth.example.com'],
			scopes_supported: ['mcp:tools']
		});
		expect(response.body.data).toBeUndefined();
	});
});
