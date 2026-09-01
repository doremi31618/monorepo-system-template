export const MCP_PRIVATE_SCOPE = 'mcp:tools';
export const MCP_CMS_READ_PERMISSION = 'cms.posts.read';

export function mcpPrivateResourceUri(): string {
	const baseUrl =
		process.env.API_BASE_URL ??
		process.env.OAUTH_ISSUER ??
		'http://localhost:3333';
	return (
		process.env.MCP_PRIVATE_RESOURCE_URI ??
		`${baseUrl.replace(/\/$/, '')}/mcp/private`
	);
}
