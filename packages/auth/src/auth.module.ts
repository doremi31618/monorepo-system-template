import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '@platform/users';
import { SessionRepository } from './auth.repository.js';
import { SessionCleanupService } from './session-cleanup.service.js';
import { GoogleService } from './google/google.service.js';
import { GoogleController } from './google/google.controller.js';
import { MailModule } from '@platform/mail';
import { SchedulingModule } from '@platform/scheduling';
import authConfig from './auth.config.js';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@platform/logger';

@Module({
	imports: [
		ConfigModule.forFeature(authConfig),
		UserModule,
		MailModule,
		SchedulingModule,
		LoggerModule
	],
	controllers: [AuthController, GoogleController],
	providers: [
		AuthService,
		SessionCleanupService,
		SessionRepository,
		GoogleService
	],
	exports: [AuthService, SessionCleanupService, SessionRepository]
})
export class AuthModule { }
