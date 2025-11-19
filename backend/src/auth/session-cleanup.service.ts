import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionRepository } from 'src/auth/repository/session.repository';

@Injectable()
export class SessionCleanupService {
	constructor(private readonly sessionRepository: SessionRepository) {}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	async cleanupExpiredSessions() {
		return await this.sessionRepository.cleanupExpiredSessions();
	}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	async cleanupExpiredRefreshTokens() {
		return await this.sessionRepository.deleteExpiredRefreshTokens();
	}
}
