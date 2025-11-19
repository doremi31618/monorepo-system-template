import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './userModel';

export const userSessions = pgTable('user_sessions', {
	// id: uuid('id').defaultRandom().primaryKey().notNull(),
	userId: integer('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	sessionToken: text('session_token').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const refreshTokens = pgTable('user_refresh_tokens', {
	refreshToken: text('refresh_token').notNull().primaryKey(),
	userId: integer('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	expiresAt: timestamp('expires_at').notNull()
});
