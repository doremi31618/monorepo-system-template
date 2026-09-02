export { NestMcpServerModule } from './nest-mcp-server.module.js';
export {
  NestMcpHttpService,
  type NestMcpHttpHandler,
} from './nest-mcp-http.service.js';

export {
  McpServer,
  OAuthError,
  OAuthErrorCode,
  bearerAuthChallengeResponse,
  buildOAuthProtectedResourceMetadata,
  getOAuthProtectedResourceMetadataUrl,
  verifyBearerToken,
  type AuthInfo,
  type AuthMetadataOptions,
  type McpRequestContext,
  type OAuthMetadata,
  type OAuthProtectedResourceMetadata,
  type OAuthTokenVerifier,
} from '@modelcontextprotocol/server';
