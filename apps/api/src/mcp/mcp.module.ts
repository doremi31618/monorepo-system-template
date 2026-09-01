import { Module } from '@nestjs/common';
import { AccessControlModule } from '@platform/access-control';
import { LoggerModule } from '@platform/logger';
import { CmsModule as NestCmsModule } from '@platform/nest-cms';
import { NestMcpServerModule } from '@platform/nest-mcp-server';
import { McpAccessTokenVerifier } from './mcp-access-token-verifier.service.js';
import { McpCompositionService } from './mcp-composition.service.js';
import { McpController } from './mcp.controller.js';

@Module({
	imports: [
		NestMcpServerModule,
		NestCmsModule,
		AccessControlModule,
		LoggerModule
	],
	controllers: [McpController],
	providers: [McpCompositionService, McpAccessTokenVerifier]
})
export class McpModule {}
