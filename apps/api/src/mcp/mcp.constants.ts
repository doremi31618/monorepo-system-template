import type { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '../config/env.validation.js';

export const MCP_PRIVATE_SCOPE = 'mcp:tools';
export const MCP_CMS_READ_PERMISSION = 'cms.posts.read';
export const MCP_RUNTIME_CONFIG = Symbol('MCP_RUNTIME_CONFIG');

export type McpRuntimeConfig = {
	issuer: string;
	privateResourceUri: string;
};

export function createMcpRuntimeConfig(
	config: ConfigService<ApiEnv, true>
): McpRuntimeConfig {
	const issuer = config.get('OAUTH_ISSUER', { infer: true });
	const baseUrl = config.get('API_BASE_URL', { infer: true }) ?? issuer;
	return {
		issuer,
		privateResourceUri:
			config.get('MCP_PRIVATE_RESOURCE_URI', { infer: true }) ??
			`${baseUrl.replace(/\/$/, '')}/mcp/private`
	};
}
