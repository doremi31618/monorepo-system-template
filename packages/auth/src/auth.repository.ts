import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import type { Database } from '@platform/database';
import { authTokens } from './auth.schema.js';
import { lt, eq, and, gt } from 'drizzle-orm';

export type CreateSession = {
	userId: number;
	sessionToken: string;
	expiresAt: Date;
};

const TOKEN_TYPE = {
	SESSION: 'session',
	REFRESH: 'refresh',
	RESET: 'reset_password'
} as const;

import { LoggerService } from '@platform/logger';

@Injectable()
export class SessionRepository {
	constructor(
		@Inject('DB') private readonly db: Database,
		private readonly logger: LoggerService
	) {
		this.logger.setContext(SessionRepository.name);
	}

	async deleteRefreshToken(refreshToken: string) {
		try {
			const deletedRefreshToken = await this.db
				.delete(authTokens)
				.where(eq(authTokens.token, refreshToken))
				.returning({
					userId: authTokens.userId,
					refreshToken: authTokens.token
				});
			return deletedRefreshToken[0] ?? null;
		} catch (error) {
			this.logger.error('deleteRefreshToken failed', error);
			throw error;
		}
	}
	async getUserIdByRefreshToken(refreshToken: string) {
		try {
			const userId = await this.db
				.select({ userId: authTokens.userId })
				.from(authTokens)
				.where(eq(authTokens.token, refreshToken));
			return userId[0] ?? null;
		} catch (error) {
			this.logger.error('getUserIdByRefreshToken failed', error);
			throw error;
		}
	}
	async getUserIdByToken(sessionToken: string) {
		try {
			const userId = await this.db
				.select({ userId: authTokens.userId })
				.from(authTokens)
				.where(eq(authTokens.token, sessionToken));
			return userId[0] ?? null;
		} catch (error) {
			this.logger.error('getUserIdByToken failed', error);
			throw error;
		}
	}

	async deleteSessionAndRefreshTokens(userId: number) {
		try {
			const deletedSession = await this.deleteSessionByUserId(userId);
			const deletedRefreshTokens = await this.deleteRefreshTokens(userId);
			return { deletedSession, deletedRefreshTokens };
		} catch (error) {
			this.logger.error('deleteSessionAndRefreshTokens failed', error);
			throw error;
		}
	}

	async deleteRefreshTokens(useId: number) {
		try {
			const deletedRefreshTokens = await this.db
				.delete(authTokens)
				.where(eq(authTokens.userId, useId))
				.returning({
					refreshToken: authTokens.token
				});
			return deletedRefreshTokens[0] ?? null;
		} catch (error) {
			this.logger.error('deleteExpiredRefreshTokens failed', error);
			throw error;
		}
	}

	async createRefreshToken(refreshToken: string, userId: number) {
		try {
			const newRefreshToken = await this.db
				.insert(authTokens)
				.values({
					type: TOKEN_TYPE.REFRESH,
					token: refreshToken,
					userId: userId,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
				})
				.returning({
					refreshToken: authTokens.token,
					userId: authTokens.userId,
					expiresAt: authTokens.expiresAt
				});
			return newRefreshToken[0] ?? null;
		} catch (error) {
			this.logger.error('createRefreshToken failed', error);
			throw error;
		}
	}

	async getValidSessionByToken(sessionToken: string) {
		try {
			const token = await this.db
				.select()
				.from(authTokens)
				.where(
					and(
						eq(authTokens.token, sessionToken),
						gt(authTokens.expiresAt, new Date(Date.now()))
					)
				);
			return token[0] ?? null;
		} catch (error) {
			this.logger.error('getSessionByToken failed', error);
			throw error;
		}
	}

	async createSession(session: CreateSession) {
		try {
			const [newSession] = await this.db
				.insert(authTokens)
				.values({
					type: TOKEN_TYPE.SESSION,
					userId: session.userId,
					token: session.sessionToken,
					expiresAt: session.expiresAt
				})
				.returning({
					//id: schema.userSessions.id,
					userId: authTokens.userId,
					sessionToken: authTokens.token,
					expiresAt: authTokens.expiresAt
				});
			return newSession;
		} catch (error) {
			this.logger.error('createSession failed', error);
			throw error;
		}
	}
	async deleteSessionByUserId(userId: number) {
		try {
			const deletedSession = await this.db
				.delete(authTokens)
				.where(eq(authTokens.userId, userId))
				.returning({
					sessionToken: authTokens.token
				});
			if (deletedSession.length === 0) {
				return null;
			}
			return deletedSession[0] ?? null;
		} catch (error) {
			this.logger.error('deleteSessionByUserId failed', error);
			throw error;
		}
	}
	async deleteSessionByToken(sessionToken: string) {
		try {
			const deletedSession = await this.db
				.delete(authTokens)
				.where(eq(authTokens.token, sessionToken))
				.returning({
					id: authTokens.token,
					userId: authTokens.userId
				});
			return deletedSession[0] ?? null;
		} catch (error) {
			this.logger.error('deleteSession failed', error);
			throw error;
		}
	}

	async cleanupExpiredRefreshTokens() {
		try {
			const deletedRefreshTokens = await this.db
				.delete(authTokens)
				.where(
					lt(authTokens.expiresAt, new Date(Date.now()))
				)
				.returning({
					refreshToken: authTokens.token
				});
			return deletedRefreshTokens[0] ?? null;
		} catch (error) {
			this.logger.error('deleteExpiredRefreshTokens failed', error);
			throw error;
		}
	}

	async cleanupExpiredSessions() {
		try {
			this.logger.log('cleanupExpiredSessions started');
			const deletedSessions = await this.db
				.delete(authTokens)
				.where(
					lt(authTokens.expiresAt, new Date(Date.now()))
				)
				.returning({
					id: authTokens.token
				});
			return `clean up ${deletedSessions.length} sessions`;
		} catch (error) {
			this.logger.error('cleanupExpiredSessions failed', error);
			throw error;
		}
	}

	async deleteResetTokensByUser(userId: number) {
		try {
			await this.db
				.delete(authTokens)
				.where(
					and(
						eq(authTokens.userId, userId),
						eq(authTokens.type, TOKEN_TYPE.RESET)
					)
				);
		} catch (error) {
			this.logger.error('deleteResetTokensByUser failed', error);
			throw error;
		}
	}

	async deleteAllTokensByUser(userId: number) {
		try {
			await this.db
				.delete(authTokens)
				.where(eq(authTokens.userId, userId));
		} catch (error) {
			this.logger.error('deleteAllTokensByUser failed', error);
			throw error;
		}
	}

	async createResetToken(userId: number, ttlMs: number) {
		try {
			await this.deleteResetTokensByUser(userId);
			const tokenValue = crypto.randomUUID();
			const [token] = await this.db
				.insert(authTokens)
				.values({
					userId,
					token: tokenValue,
					type: TOKEN_TYPE.RESET,
					expiresAt: new Date(Date.now() + ttlMs)
				})
				.returning({
					token: authTokens.token,
					expiresAt: authTokens.expiresAt
				});
			return token;
		} catch (error) {
			this.logger.error('createResetToken failed', error);
			throw error;
		}
	}

	async consumeResetToken(token: string) {
		try {
			const [row] = await this.db
				.delete(authTokens)
				.where(
					and(
						eq(authTokens.token, token),
						eq(authTokens.type, TOKEN_TYPE.RESET),
						gt(authTokens.expiresAt, new Date(Date.now()))
					)
				)
				.returning({
					userId: authTokens.userId
				});
			return row ?? null;
		} catch (error) {
			this.logger.error('consumeResetToken failed', error);
			throw error;
		}
	}
}
