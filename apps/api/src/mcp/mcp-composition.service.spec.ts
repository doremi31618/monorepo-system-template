import express from 'express';
import request from 'supertest';
import type { AuthInfo } from '@platform/nest-mcp-server';
import { NestMcpHttpService } from '@platform/nest-mcp-server';
import { McpCompositionService } from './mcp-composition.service.js';
import { McpController } from './mcp.controller.js';

describe('McpCompositionService', () => {
	const date = new Date('2026-09-01T00:00:00.000Z');
	const cms = {
		searchPublished: jest.fn(async () => ({
			data: [
				{
					id: 'post-1',
					slug: 'hello-mcp',
					title: 'Hello MCP',
					excerpt: 'Summary only',
					tags: [],
					coverImage: null,
					createdAt: date,
					updatedAt: date,
					publishedAt: date
				}
			],
			page: 1,
			limit: 10,
			total: 1
		})),
		searchWorkspace: jest.fn(async () => ({
			data: [
				{
					id: 'draft-1',
					slug: 'draft',
					title: 'Draft',
					excerpt: 'Private summary',
					tags: [],
					status: 'draft',
					authorId: 42,
					createdAt: date,
					updatedAt: date,
					publishedAt: null
				}
			],
			page: 1,
			limit: 10,
			total: 1
		}))
	};
	const accessControl = { hasPermission: jest.fn(async () => true) };
	const logger = { setContext: jest.fn(), log: jest.fn() };
	let http: NestMcpHttpService;
	let composition: McpCompositionService;

	beforeEach(() => {
		jest.clearAllMocks();
		accessControl.hasPermission.mockResolvedValue(true);
		http = new NestMcpHttpService();
		composition = new McpCompositionService(
			http,
			cms as any,
			accessControl as any,
			logger as any
		);
	});

	afterEach(async () => {
		await http.onApplicationShutdown();
	});

	it('answers the MCP initialize handshake through the stateless endpoint', async () => {
		const app = express();
		app.use(express.json());
		app.all('/mcp/public', (req, res) => {
			void composition.publicHandler(req, res, req.body);
		});

		const initialize = await mcpRequest(app, '/mcp/public', 'initialize', {
			protocolVersion: '2025-11-25',
			capabilities: {},
			clientInfo: { name: 'integration-test', version: '1.0.0' }
		});
		expect(mcpBody(initialize).result).toMatchObject({
			serverInfo: { name: 'monorepo-public-cms', version: '1.0.0' },
			capabilities: { tools: {} }
		});
	});

	it('lists and calls the public read-only CMS tool through real Streamable HTTP', async () => {
		const app = express();
		app.use(express.json());
		app.all('/mcp/public', (req, res) => {
			void composition.publicHandler(req, res, req.body);
		});

		const list = await mcpRequest(app, '/mcp/public', 'tools/list', {});
		expect(list.status).toBe(200);
		expect(mcpBody(list).result.tools).toEqual([
			expect.objectContaining({
				name: 'cms_search_published_posts',
				annotations: expect.objectContaining({ readOnlyHint: true })
			})
		]);

		const call = await mcpRequest(app, '/mcp/public', 'tools/call', {
			name: 'cms_search_published_posts',
			arguments: { query: 'hello' }
		});
		expect(call.status).toBe(200);
		expect(mcpBody(call).result.structuredContent).toMatchObject({
			total: 1,
			data: [
				expect.objectContaining({
					title: 'Hello MCP',
					publishedAt: '2026-09-01T00:00:00.000Z'
				})
			]
		});
		expect(call.text).not.toContain('body');
	});

	it('hides the private tool when RBAC permission is absent', async () => {
		accessControl.hasPermission.mockResolvedValue(false);
		const app = privateApp(composition);

		const list = await mcpRequest(app, '/mcp/private', 'tools/list', {});
		expect(list.status).toBe(200);
		expect(mcpBody(list).error).toMatchObject({ code: -32601 });
	});

	it('lists and calls the private CMS tool when OAuth identity has RBAC permission', async () => {
		const app = privateApp(composition);

		const list = await mcpRequest(app, '/mcp/private', 'tools/list', {});
		expect(mcpBody(list).result.tools).toEqual([
			expect.objectContaining({ name: 'cms_search_posts' })
		]);

		const call = await mcpRequest(app, '/mcp/private', 'tools/call', {
			name: 'cms_search_posts',
			arguments: { status: 'draft' }
		});
		expect(mcpBody(call).result.structuredContent).toMatchObject({
			data: [expect.objectContaining({ status: 'draft', authorId: 42 })]
		});
		expect(call.text).not.toContain('body');
		expect(accessControl.hasPermission).toHaveBeenCalledTimes(3);
	});

	it('returns safe invalid-params errors for invalid tool input', async () => {
		const app = express();
		app.use(express.json());
		app.all('/mcp/public', (req, res) => {
			void composition.publicHandler(req, res, req.body);
		});

		const call = await mcpRequest(app, '/mcp/public', 'tools/call', {
			name: 'cms_search_published_posts',
			arguments: { limit: 1000 }
		});
		expect(mcpBody(call).result).toMatchObject({ isError: true });
		expect(mcpBody(call).result.content[0].text).toContain(
			'Input validation error'
		);
		expect(call.text).not.toContain('stack');
	});

	it('redacts internal CMS failures from tool results', async () => {
		cms.searchPublished.mockRejectedValueOnce(
			new Error('password=secret database unavailable')
		);
		const app = express();
		app.use(express.json());
		app.all('/mcp/public', (req, res) => {
			void composition.publicHandler(req, res, req.body);
		});

		const call = await mcpRequest(app, '/mcp/public', 'tools/call', {
			name: 'cms_search_published_posts',
			arguments: {}
		});
		expect(mcpBody(call).result).toMatchObject({
			isError: true,
			content: [{ type: 'text', text: 'The CMS search could not be completed' }]
		});
		expect(call.text).not.toContain('password=secret');
	});

	it('publishes protected-resource metadata for the exact private resource', () => {
		expect(composition.getProtectedResourceMetadata()).toMatchObject({
			resource: 'http://localhost:3333/mcp/private',
			authorization_servers: ['http://localhost:3333'],
			scopes_supported: ['mcp:tools']
		});
	});

	it('returns an OAuth resource_metadata challenge when private auth is missing', async () => {
		const controller = new McpController(composition, {} as any);
		const app = express();
		app.use(express.json());
		app.all('/mcp/private', (req, res) => {
			void controller.privateMcp(req, res);
		});

		const response = await mcpRequest(app, '/mcp/private', 'tools/list', {});
		expect(response.status).toBe(401);
		expect(response.headers['www-authenticate']).toContain(
			'resource_metadata="http://localhost:3333/.well-known/oauth-protected-resource/mcp/private"'
		);
	});

	it('returns 403 before MCP dispatch when OAuth succeeds but RBAC denies CMS read', async () => {
		accessControl.hasPermission.mockResolvedValue(false);
		const tokenVerifier = {
			verifyAccessToken: jest.fn(async () => ({
				token: 'token',
				clientId: 'client',
				scopes: ['mcp:tools'],
				expiresAt: Math.floor(Date.now() / 1000) + 900,
				resource: new URL('http://localhost:3333/mcp/private'),
				extra: { userId: 42 }
			}))
		};
		const controller = new McpController(composition, tokenVerifier as any);
		const app = express();
		app.use(express.json());
		app.all('/mcp/private', (req, res) => {
			void controller.privateMcp(req, res);
		});

		const response = await mcpRequest(
			app,
			'/mcp/private',
			'tools/list',
			{}
		).set('Authorization', 'Bearer token');
		expect(response.status).toBe(403);
		expect(response.body).toMatchObject({ error: 'forbidden' });
	});
});

function privateApp(composition: McpCompositionService) {
	const app = express();
	const auth: AuthInfo = {
		token: 'token',
		clientId: 'client',
		scopes: ['mcp:tools'],
		expiresAt: Math.floor(Date.now() / 1000) + 900,
		resource: new URL('http://localhost:3333/mcp/private'),
		extra: { userId: 42 }
	};
	app.use(express.json());
	app.all('/mcp/private', (req, res) => {
		(req as typeof req & { auth: AuthInfo }).auth = auth;
		void composition.privateHandler(req, res, req.body);
	});
	return app;
}

function mcpRequest(
	app: express.Express,
	path: string,
	method: string,
	params: Record<string, unknown>
) {
	return request(app)
		.post(path)
		.set('Accept', 'application/json, text/event-stream')
		.set('Content-Type', 'application/json')
		.send({ jsonrpc: '2.0', id: 1, method, params });
}

function mcpBody(response: request.Response): any {
	if (!response.headers['content-type']?.includes('text/event-stream')) {
		return response.body;
	}
	const dataLine = response.text
		.split('\n')
		.find((line) => line.startsWith('data: '));
	if (!dataLine)
		throw new Error('MCP SSE response did not contain a data event');
	return JSON.parse(dataLine.slice('data: '.length));
}
