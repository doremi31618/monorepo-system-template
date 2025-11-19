import { Inject, Injectable } from '@nestjs/common';
import { type DB } from 'src/db/db';
import { schema } from 'src/db/schema';
import { lt, eq, and, gt } from 'drizzle-orm';

export type CreateSession = {
	userId: number;
	sessionToken: string;
	expiresAt: Date;
};

@Injectable()
export class SessionRepository {
	constructor(@Inject('DB') private readonly db: DB) {}

	async deleteRefreshToken(refreshToken: string) {
		try {
			const deletedRefreshToken = await this.db
				.delete(schema.authModel.refreshTokens)
				.where(eq(schema.authModel.refreshTokens.refreshToken, refreshToken))
				.returning({
					userId: schema.authModel.refreshTokens.userId,
					refreshToken: schema.authModel.refreshTokens.refreshToken
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
				.select({ userId: schema.authModel.refreshTokens.userId })
				.from(schema.authModel.refreshTokens)
				.where(eq(schema.authModel.refreshTokens.refreshToken, refreshToken));
			return userId[0] ?? null;
		} catch (error) {
			console.error('getUserIdByRefreshToken failed', error);
			throw error;
		}
	}
	async getUserIdByToken(sessionToken: string) {
		try {
			const userId = await this.db
				.select({ userId: schema.authModel.userSessions.userId })
				.from(schema.authModel.userSessions)
				.where(eq(schema.authModel.userSessions.sessionToken, sessionToken));
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
				.delete(schema.authModel.refreshTokens)
				.where(eq(schema.authModel.refreshTokens.userId, useId))
				.returning({
					refreshToken: schema.authModel.refreshTokens.refreshToken
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
				.insert(schema.authModel.refreshTokens)
				.values({
					refreshToken: refreshToken,
					userId: userId,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
				})
				.returning({
					refreshToken: schema.authModel.refreshTokens.refreshToken,
					userId: schema.authModel.refreshTokens.userId,
					expiresAt: schema.authModel.refreshTokens.expiresAt
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
				.from(schema.authModel.userSessions)
				.where(
					and(
						eq(schema.authModel.userSessions.sessionToken, sessionToken),
						gt(schema.authModel.userSessions.expiresAt, new Date(Date.now()))
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
				.insert(schema.authModel.userSessions)
				.values({
					userId: session.userId,
					sessionToken: session.sessionToken,
					expiresAt: session.expiresAt
				})
				.returning({
					//id: schema.authModel.userSessions.id,
					userId: schema.authModel.userSessions.userId,
					sessionToken: schema.authModel.userSessions.sessionToken,
					expiresAt: schema.authModel.userSessions.expiresAt
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
				.delete(schema.authModel.userSessions)
				.where(eq(schema.authModel.userSessions.userId, userId))
				.returning({
					sessionToken: schema.authModel.userSessions.sessionToken
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
				.delete(schema.authModel.userSessions)
				.where(eq(schema.authModel.userSessions.sessionToken, sessionToken))
				.returning({
					id: schema.authModel.userSessions.sessionToken,
					userId: schema.authModel.userSessions.userId
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
				.delete(schema.authModel.refreshTokens)
				.where(
					lt(schema.authModel.refreshTokens.expiresAt, new Date(Date.now()))
				)
				.returning({
					refreshToken: schema.authModel.refreshTokens.refreshToken
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
				.delete(schema.authModel.userSessions)
				.where(
					lt(schema.authModel.userSessions.expiresAt, new Date(Date.now()))
				)
				.returning({
					id: schema.authModel.userSessions.sessionToken
				});
			return `clean up ${deletedSessions.length} sessions`;
		} catch (error) {
			console.error('cleanupExpiredSessions failed', error);
			throw error;
		}
	}
}
