import { Injectable } from '@nestjs/common';
import { AccessControlService } from '@platform/access-control';
import type {
	CmsPostSummary,
	CmsPublicPostSummary,
	CmsSearchPage
} from '@platform/cms';
import { LoggerService } from '@platform/logger';
import {
	McpServer,
	NestMcpHttpService,
	buildOAuthProtectedResourceMetadata,
	getOAuthProtectedResourceMetadataUrl,
	type AuthInfo,
	type NestMcpHttpHandler,
	type OAuthMetadata
} from '@platform/nest-mcp-server';
import { CmsService } from '@platform/nest-cms';
import * as z from 'zod/v4';
import {
	MCP_CMS_READ_PERMISSION,
	MCP_PRIVATE_SCOPE,
	mcpPrivateResourceUri
} from './mcp.constants.js';

const publicSearchInput = z.object({
	query: z.string().trim().min(1).max(200).optional(),
	locale: z.string().trim().min(2).max(20).default('en'),
	tagSlug: z.string().trim().min(1).max(100).optional(),
	sort: z.enum(['latest', 'popular']).default('latest'),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10)
});

const privateSearchInput = z.object({
	query: z.string().trim().min(1).max(200).optional(),
	locale: z.string().trim().min(2).max(20).default('en'),
	status: z.enum(['all', 'draft', 'published', 'archived']).default('all'),
	tagId: z.string().trim().min(1).max(100).optional(),
	updatedFrom: z.string().trim().min(8).max(40).optional(),
	updatedTo: z.string().trim().min(8).max(40).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(10)
});

function serializePage<T>(page: CmsSearchPage<T>): Record<string, unknown> {
	return JSON.parse(JSON.stringify(page)) as Record<string, unknown>;
}

@Injectable()
export class McpCompositionService {
	readonly publicHandler: NestMcpHttpHandler;
	readonly privateHandler: NestMcpHttpHandler;
	readonly privateResourceUri = new URL(mcpPrivateResourceUri());
	readonly resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(
		this.privateResourceUri
	);

	constructor(
		private readonly mcpHttp: NestMcpHttpService,
		private readonly cms: CmsService,
		private readonly accessControl: AccessControlService,
		private readonly logger: LoggerService
	) {
		this.logger.setContext(McpCompositionService.name);
		this.publicHandler = this.mcpHttp.createHandler(() =>
			this.createPublicServer()
		);
		this.privateHandler = this.mcpHttp.createHandler(({ authInfo }) =>
			this.createPrivateServer(authInfo)
		);
	}

	getProtectedResourceMetadata() {
		const issuer = (
			process.env.OAUTH_ISSUER ?? 'http://localhost:3333'
		).replace(/\/$/, '');
		const oauthMetadata = {
			issuer,
			authorization_endpoint: `${issuer}/oauth/authorize`,
			token_endpoint: `${issuer}/oauth/token`,
			registration_endpoint: `${issuer}/oauth/register`,
			revocation_endpoint: `${issuer}/oauth/revoke`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			token_endpoint_auth_methods_supported: ['none', 'client_secret_basic'],
			code_challenge_methods_supported: ['S256']
		} satisfies OAuthMetadata;

		return buildOAuthProtectedResourceMetadata({
			oauthMetadata,
			resourceServerUrl: this.privateResourceUri,
			scopesSupported: [MCP_PRIVATE_SCOPE],
			resourceName: 'Private workspace MCP',
			dangerouslyAllowInsecureIssuerUrl:
				this.privateResourceUri.hostname === 'localhost' ||
				this.privateResourceUri.hostname === '127.0.0.1'
		});
	}

	async canReadPrivateCms(authInfo?: AuthInfo): Promise<boolean> {
		const userId = this.userId(authInfo);
		return (
			userId !== undefined &&
			this.accessControl.hasPermission(userId, MCP_CMS_READ_PERMISSION)
		);
	}

	private createPublicServer(): McpServer {
		const server = new McpServer({
			name: 'monorepo-public-cms',
			version: '1.0.0'
		});
		server.registerTool(
			'cms_search_published_posts',
			{
				title: 'Search published CMS posts',
				description:
					'Search published CMS article summaries. Full article bodies are never returned.',
				inputSchema: publicSearchInput,
				annotations: {
					readOnlyHint: true,
					destructiveHint: false,
					idempotentHint: true,
					openWorldHint: false
				}
			},
			async (input) => {
				const startedAt = Date.now();
				try {
					const page: CmsSearchPage<CmsPublicPostSummary> =
						await this.cms.searchPublished(input);
					const output = serializePage(page);
					this.logCall(
						'public',
						'cms_search_published_posts',
						'success',
						startedAt
					);
					return {
						content: [{ type: 'text', text: JSON.stringify(output) }],
						structuredContent: output
					};
				} catch {
					this.logCall(
						'public',
						'cms_search_published_posts',
						'failure',
						startedAt
					);
					return {
						isError: true,
						content: [
							{ type: 'text', text: 'The CMS search could not be completed' }
						]
					};
				}
			}
		);
		return server;
	}

	private async createPrivateServer(authInfo?: AuthInfo): Promise<McpServer> {
		const server = new McpServer({
			name: 'monorepo-private-cms',
			version: '1.0.0'
		});
		const userId = this.userId(authInfo);
		if (userId === undefined || !(await this.canReadPrivateCms(authInfo))) {
			return server;
		}

		server.registerTool(
			'cms_search_posts',
			{
				title: 'Search workspace CMS posts',
				description:
					'Search draft, published, or archived CMS article summaries in the shared workspace.',
				inputSchema: privateSearchInput,
				annotations: {
					readOnlyHint: true,
					destructiveHint: false,
					idempotentHint: true,
					openWorldHint: false
				}
			},
			async (input) => {
				const startedAt = Date.now();
				if (
					!(await this.accessControl.hasPermission(
						userId,
						MCP_CMS_READ_PERMISSION
					))
				) {
					this.logCall(
						'private',
						'cms_search_posts',
						'forbidden',
						startedAt,
						userId
					);
					return {
						isError: true,
						content: [{ type: 'text', text: 'Permission denied' }]
					};
				}

				try {
					const page: CmsSearchPage<CmsPostSummary> =
						await this.cms.searchWorkspace(input);
					const output = serializePage(page);
					this.logCall(
						'private',
						'cms_search_posts',
						'success',
						startedAt,
						userId
					);
					return {
						content: [{ type: 'text', text: JSON.stringify(output) }],
						structuredContent: output
					};
				} catch {
					this.logCall(
						'private',
						'cms_search_posts',
						'failure',
						startedAt,
						userId
					);
					return {
						isError: true,
						content: [
							{ type: 'text', text: 'The CMS search could not be completed' }
						]
					};
				}
			}
		);
		return server;
	}

	private userId(authInfo?: AuthInfo): number | undefined {
		const value = authInfo?.extra?.userId;
		return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
			? value
			: undefined;
	}

	private logCall(
		endpoint: 'public' | 'private',
		tool: string,
		outcome: 'success' | 'failure' | 'forbidden',
		startedAt: number,
		userId?: number
	) {
		this.logger.log({
			event: 'mcp.tool_call',
			endpoint,
			tool,
			outcome,
			durationMs: Date.now() - startedAt,
			...(userId === undefined ? {} : { userId })
		});
	}
}
