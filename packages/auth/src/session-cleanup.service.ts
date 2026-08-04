import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionRepository } from './auth.repository.js';
import { JobSchedulerPort } from '@platform/scheduling';

@Injectable()
export class SessionCleanupService implements OnModuleInit {
	private readonly jobs = {
		cleanupExpiredSessions: 'cleanupExpiredSessions',
		cleanupExpiredRefreshTokens: 'cleanupExpiredRefreshTokens'
	}
	constructor(
		private readonly sessionRepository: SessionRepository,
		private readonly schedulingService: JobSchedulerPort
	) { }

	onModuleInit() {

		//register job handlers
		//register cleanupExpiredSessions job
		this.schedulingService.registerHandler(this.jobs['cleanupExpiredSessions'], async () => {
			await this.sessionRepository.cleanupExpiredSessions();
		})

		//register cleanupExpiredRefreshTokens job
		this.schedulingService.registerHandler(this.jobs['cleanupExpiredRefreshTokens'], async () => {
			await this.sessionRepository.cleanupExpiredRefreshTokens();
		})

	}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	async cleanupExpiredSessions() {
		this.schedulingService.schedule(
			this.jobs['cleanupExpiredSessions'],
			null,
			new Date()
		);
	}

	@Cron(CronExpression.EVERY_DAY_AT_1AM)
	async cleanupExpiredRefreshTokens() {
		this.schedulingService.schedule(
			this.jobs['cleanupExpiredRefreshTokens'],
			null,
			new Date()
		);
	}
}
