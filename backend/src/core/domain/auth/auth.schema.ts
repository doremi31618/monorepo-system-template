import { integer, pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../user/user.schema.js';


const tokenType = pgEnum('auth_token_type', ['session', 'refresh', 'reset_password']);
export const authTokens = pgTable('auth_token', {
	userId: integer('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	token: text('token').notNull().primaryKey(),
	type: tokenType('type').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

const providerType = pgEnum('auth_provider_type', ['google', 'Line']);
export const authProviders = pgTable('auth_provider', {
	userId: integer('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	provider: providerType('provider').notNull(),
	providerId: text('provider_id').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// export const userSessions = pgTable('user_sessions', {
// 	// id: uuid('id').defaultRandom().primaryKey().notNull(),
// 	userId: integer('user_id')
// 		.primaryKey()
// 		.references(() => users.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	sessionToken: text('session_token').notNull(),
// 	expiresAt: timestamp('expires_at').notNull(),
// 	createdAt: timestamp('created_at').notNull().defaultNow(),
// 	updatedAt: timestamp('updated_at').notNull().defaultNow()
// });

// export const refreshTokens = pgTable('user_refresh_tokens', {
// 	refreshToken: text('refresh_token').notNull().primaryKey(),
// 	userId: integer('user_id')
// 		.references(() => users.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	createdAt: timestamp('created_at').notNull().defaultNow(),
// 	expiresAt: timestamp('expires_at').notNull()
// });
