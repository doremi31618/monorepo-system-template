import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { SessionRepository } from 'src/auth/repository/session.repository';
import { SessionCleanupService } from 'src/auth/session-cleanup.service';
import { DbModule } from 'src/db/db.module';
@Module({
	imports: [UserModule, DbModule],
	controllers: [AuthController],
	providers: [AuthService, SessionCleanupService, SessionRepository, DbModule],
	exports: [AuthService, SessionCleanupService, SessionRepository]
})
export class AuthModule {}
