import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMcpServerModule } from '@platform/nest-infra-mcp-server';
import { CoreModule } from '../core/core.module.js';
import { McpAccessTokenVerifier } from './mcp-access-token-verifier.service.js';
import { McpCompositionService } from './mcp-composition.service.js';
import { McpController } from './mcp.controller.js';
import {
	createMcpRuntimeConfig,
	MCP_RUNTIME_CONFIG
} from './mcp.constants.js';

@Module({
	imports: [
		ConfigModule,
		NestMcpServerModule,
		CoreModule
	],
	controllers: [McpController],
	providers: [
		{
			provide: MCP_RUNTIME_CONFIG,
			inject: [ConfigService],
			useFactory: createMcpRuntimeConfig
		},
		McpCompositionService,
		McpAccessTokenVerifier
	]
})
export class McpModule {}
