import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { SessionRepository } from './auth.repository';
import { SessionCleanupService } from './session-cleanup.service';
import { DbModule } from '../../infra/db/db.module';
import { GoogleService } from './google/google.service';
import { GoogleController } from './google/google.controller';
import { MailModule } from '../../infra/mail/mail.module';
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
