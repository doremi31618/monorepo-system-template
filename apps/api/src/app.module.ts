import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './core/core.module.js';
import { validateApiEnv } from './config/env.validation.js';
import { OAuthModule } from './oauth/oauth.module.js';
import { McpModule } from './mcp/mcp.module.js';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({
			isGlobal: true,
			validate: validateApiEnv
		}),
		CoreModule,
		OAuthModule,
		McpModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
