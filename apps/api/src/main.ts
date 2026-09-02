import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

import cookieParser from 'cookie-parser';
import { LoggerService } from '@platform/nest-infra-logger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true
	});
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1'
	});
	app.useLogger(await app.resolve(LoggerService));
	app.enableCors({ origin: true, credentials: true });
	app.use(cookieParser());

	const configService = app.get(ConfigService);

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

	const port = configService.getOrThrow<number>('PORT');
	await app.listen(port);
	const baseUrl =
		configService.get<string>('API_BASE_URL') ?? (await app.getUrl());
	console.info(`Auth API listening on ${baseUrl}`);
}
bootstrap();
