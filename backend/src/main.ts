import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

import type { AppConfig } from './core/infra/config/app.config.js';
import cookieParser from 'cookie-parser';
import { LoggerService } from './core/infra/logger/logger.service.js';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});
	app.useLogger(app.get(LoggerService));
	app.enableCors({ origin: true, credentials: true });
	app.use(cookieParser());


	const configService = app.get(ConfigService);
	const appConfig = configService.get<AppConfig>('app');

	const config = new DocumentBuilder()
		.setTitle('Auth API')
		.setDescription('API documentation for the authentication service')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'Paste the session token (without Bearer prefix).'
			},
			'access-token'
		)
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('openapi', app, document);

	const port = appConfig?.port ?? 3000;
	await app.listen(port);
	const baseUrl = appConfig?.baseUrl ?? (await app.getUrl());
	console.info(`Auth API listening on ${baseUrl}`);
}
bootstrap();
