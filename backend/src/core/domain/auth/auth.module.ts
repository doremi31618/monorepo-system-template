import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../user/user.module.js';
import { SessionRepository } from './auth.repository.js';
import { SessionCleanupService } from './session-cleanup.service.js';
import { DbModule } from '../../infra/db/db.module.js';
import { GoogleService } from './google/google.service.js';
import { GoogleController } from './google/google.controller.js';
import { MailModule } from '../../infra/mail/mail.module.js';
@Module({
	imports: [UserModule, DbModule, MailModule],
	controllers: [AuthController, GoogleController],
	providers: [
		AuthService,
		SessionCleanupService,
		SessionRepository,
		DbModule,
		GoogleService
	],
	exports: [AuthService, SessionCleanupService, SessionRepository]
})
export class AuthModule { }
