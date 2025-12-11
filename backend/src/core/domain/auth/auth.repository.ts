import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { type DB } from 'src/core/infra/db/db';
import { schema } from 'src/core/infra/db/schema';
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

@Injectable()
export class SessionRepository {
	constructor(@Inject('DB') private readonly db: DB) { }

	async deleteRefreshToken(refreshToken: string) {
		try {
			const deletedRefreshToken = await this.db
				.delete(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.token, refreshToken))
				.returning({
					userId: schema.authModel.authTokens.userId,
					refreshToken: schema.authModel.authTokens.token
				});
			return deletedRefreshToken[0] ?? null;
		} catch (error) {
			console.error('deleteRefreshToken failed', error);
			throw error;
		}
	}
	async getUserIdByRefreshToken(refreshToken: string) {
		try {
			const userId = await this.db
				.select({ userId: schema.authModel.authTokens.userId })
				.from(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.token, refreshToken));
			return userId[0] ?? null;
		} catch (error) {
			console.error('getUserIdByRefreshToken failed', error);
			throw error;
		}
	}
	async getUserIdByToken(sessionToken: string) {
		try {
			const userId = await this.db
				.select({ userId: schema.authModel.authTokens.userId })
				.from(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.token, sessionToken));
			return userId[0] ?? null;
		} catch (error) {
			console.error('getUserIdByToken failed', error);
			throw error;
		}
	}

	async deleteSessionAndRefreshTokens(userId: number) {
		try {
			const deletedSession = await this.deleteSessionByUserId(userId);
			const deletedRefreshTokens = await this.deleteRefreshTokens(userId);
			return { deletedSession, deletedRefreshTokens };
		} catch (error) {
			console.error('deleteSessionAndRefreshTokens failed', error);
			throw error;
		}
	}

	async deleteRefreshTokens(useId: number) {
		try {
			const deletedRefreshTokens = await this.db
				.delete(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.userId, useId))
				.returning({
					refreshToken: schema.authModel.authTokens.token
				});
			return deletedRefreshTokens[0] ?? null;
		} catch (error) {
			console.error('deleteExpiredRefreshTokens failed', error);
			throw error;
		}
	}

	async createRefreshToken(refreshToken: string, userId: number) {
		try {
			const newRefreshToken = await this.db
				.insert(schema.authModel.authTokens)
				.values({
					type: TOKEN_TYPE.REFRESH,
					token: refreshToken,
					userId: userId,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
				})
				.returning({
					refreshToken: schema.authModel.authTokens.token,
					userId: schema.authModel.authTokens.userId,
					expiresAt: schema.authModel.authTokens.expiresAt
				});
			return newRefreshToken[0] ?? null;
		} catch (error) {
			console.error('createRefreshToken failed', error);
			throw error;
		}
	}

	async getValidSessionByToken(sessionToken: string) {
		try {
			const token = await this.db
				.select()
				.from(schema.authModel.authTokens)
				.where(
					and(
						eq(schema.authModel.authTokens.token, sessionToken),
						gt(schema.authModel.authTokens.expiresAt, new Date(Date.now()))
					)
				);
			return token[0] ?? null;
		} catch (error) {
			console.error('getSessionByToken failed', error);
			throw error;
		}
	}

	async createSession(session: CreateSession) {
		try {
			const [newSession] = await this.db
				.insert(schema.authModel.authTokens)
				.values({
					type: TOKEN_TYPE.SESSION,
					userId: session.userId,
					token: session.sessionToken,
					expiresAt: session.expiresAt
				})
				.returning({
					//id: schema.authModel.userSessions.id,
					userId: schema.authModel.authTokens.userId,
					sessionToken: schema.authModel.authTokens.token,
					expiresAt: schema.authModel.authTokens.expiresAt
				});
			return newSession;
		} catch (error) {
			console.error('createSession failed', error);
			throw error;
		}
	}
	async deleteSessionByUserId(userId: number) {
		try {
			const deletedSession = await this.db
				.delete(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.userId, userId))
				.returning({
					sessionToken: schema.authModel.authTokens.token
				});
			if (deletedSession.length === 0) {
				return null;
			}
			return deletedSession[0] ?? null;
		} catch (error) {
			console.error('deleteSessionByUserId failed', error);
			throw error;
		}
	}
	async deleteSessionByToken(sessionToken: string) {
		try {
			const deletedSession = await this.db
				.delete(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.token, sessionToken))
				.returning({
					id: schema.authModel.authTokens.token,
					userId: schema.authModel.authTokens.userId
				});
			return deletedSession[0] ?? null;
		} catch (error) {
			console.error('deleteSession failed', error);
			throw error;
		}
	}

	async deleteExpiredRefreshTokens() {
		try {
			const deletedRefreshTokens = await this.db
				.delete(schema.authModel.authTokens)
				.where(
					lt(schema.authModel.authTokens.expiresAt, new Date(Date.now()))
				)
				.returning({
					refreshToken: schema.authModel.authTokens.token
				});
			return deletedRefreshTokens[0] ?? null;
		} catch (error) {
			console.error('deleteExpiredRefreshTokens failed', error);
			throw error;
		}
	}

	async cleanupExpiredSessions() {
		try {
			console.info('cleanupExpiredSessions started');
			const deletedSessions = await this.db
				.delete(schema.authModel.authTokens)
				.where(
					lt(schema.authModel.authTokens.expiresAt, new Date(Date.now()))
				)
				.returning({
					id: schema.authModel.authTokens.token
				});
			return `clean up ${deletedSessions.length} sessions`;
		} catch (error) {
			console.error('cleanupExpiredSessions failed', error);
			throw error;
		}
	}

	async deleteResetTokensByUser(userId: number) {
		try {
			await this.db
				.delete(schema.authModel.authTokens)
				.where(
					and(
						eq(schema.authModel.authTokens.userId, userId),
						eq(schema.authModel.authTokens.type, TOKEN_TYPE.RESET)
					)
				);
		} catch (error) {
			console.error('deleteResetTokensByUser failed', error);
			throw error;
		}
	}

	async deleteAllTokensByUser(userId: number) {
		try {
			await this.db
				.delete(schema.authModel.authTokens)
				.where(eq(schema.authModel.authTokens.userId, userId));
		} catch (error) {
			console.error('deleteAllTokensByUser failed', error);
			throw error;
		}
	}

	async createResetToken(userId: number, ttlMs: number) {
		try {
			await this.deleteResetTokensByUser(userId);
			const tokenValue = crypto.randomUUID();
			const [token] = await this.db
				.insert(schema.authModel.authTokens)
				.values({
					userId,
					token: tokenValue,
					type: TOKEN_TYPE.RESET,
					expiresAt: new Date(Date.now() + ttlMs)
				})
				.returning({
					token: schema.authModel.authTokens.token,
					expiresAt: schema.authModel.authTokens.expiresAt
				});
			return token;
		} catch (error) {
			console.error('createResetToken failed', error);
			throw error;
		}
	}

	async consumeResetToken(token: string) {
		try {
			const [row] = await this.db
				.delete(schema.authModel.authTokens)
				.where(
					and(
						eq(schema.authModel.authTokens.token, token),
						eq(schema.authModel.authTokens.type, TOKEN_TYPE.RESET),
						gt(schema.authModel.authTokens.expiresAt, new Date(Date.now()))
					)
				)
				.returning({
					userId: schema.authModel.authTokens.userId
				});
			return row ?? null;
		} catch (error) {
			console.error('consumeResetToken failed', error);
			throw error;
		}
	}
}
