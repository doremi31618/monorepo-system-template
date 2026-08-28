import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

import type { AppConfig } from '@platform/config';
import cookieParser from 'cookie-parser';
import { LoggerService } from '@platform/logger';
import {
	PostgresRateLimiter,
	type OAuthProvider
} from '@platform/oauth-server';
import { OAUTH_PROVIDER } from './oauth/oauth.constants.js';
import type { DB } from './core/infra/db/db.js';

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
	const oauthProvider = app.get<OAuthProvider>(OAUTH_PROVIDER);
	const oauthRateLimiter = new PostgresRateLimiter(app.get<DB>('DB'));
	const oauthMiddleware = oauthProvider.callback();
	app.use(async (req, res, next) => {
		if (req.path === '/v1/auth/login' && req.method === 'POST') {
			try {
				const rateLimit = await oauthRateLimiter.consume(
					'login',
					req.ip ?? req.socket.remoteAddress ?? 'unknown',
					Number(process.env.AUTH_LOGIN_RATE_LIMIT ?? 10),
					60
				);
				if (!rateLimit.allowed) {
					res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
					return res.status(429).json({
						statusCode: 429,
						message: 'Too many login attempts',
						error: 'Too Many Requests'
					});
				}
			} catch (error) {
				return next(error);
			}
		}
		if (
			(req.path.startsWith('/oauth/') &&
				!req.path.startsWith('/oauth/interaction/')) ||
			req.path.startsWith('/.well-known/')
		) {
			if (
				req.method === 'POST' &&
				(req.path === '/oauth/register' || req.path === '/oauth/token')
			) {
				try {
					const isRegistration = req.path === '/oauth/register';
					const rateLimit = await oauthRateLimiter.consume(
						isRegistration ? 'dcr' : 'token',
						req.ip ?? req.socket.remoteAddress ?? 'unknown',
						Number(
							isRegistration
								? (process.env.OAUTH_DCR_RATE_LIMIT ?? 10)
								: (process.env.OAUTH_TOKEN_RATE_LIMIT ?? 120)
						),
						isRegistration
							? Number(process.env.OAUTH_DCR_RATE_WINDOW_SECONDS ?? 3600)
							: 60
					);
					res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
					if (!rateLimit.allowed) {
						res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
						return res.status(429).json({
							error: 'too_many_requests',
							error_description: isRegistration
								? 'Dynamic client registration rate limit exceeded'
								: 'Token endpoint rate limit exceeded'
						});
					}
				} catch (error) {
					return next(error);
				}
			}
			return oauthMiddleware(req, res);
		}
		return next();
	});

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
