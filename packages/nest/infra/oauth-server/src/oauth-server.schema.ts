import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { users } from '@platform/nest-identity-users/schema';

export const oauthResources = pgTable('oauth_resources', {
	uri: text('uri').primaryKey(),
	name: text('name').notNull(),
	allowedScopes: jsonb('allowed_scopes').$type<string[]>().notNull(),
	disabledAt: timestamp('disabled_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull()
});

export const oauthClients = pgTable(
	'oauth_clients',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		clientType: text('client_type').notNull(),
		tokenEndpointAuthMethod: text('token_endpoint_auth_method').notNull(),
		redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(),
		allowedScopes: jsonb('allowed_scopes').$type<string[]>().notNull(),
		allowedResources: jsonb('allowed_resources').$type<string[]>().notNull(),
		clientSecretHash: text('client_secret_hash'),
		secretCreatedAt: timestamp('secret_created_at', { withTimezone: true }),
		dynamic: boolean('dynamic').default(false).notNull(),
		metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
		disabledAt: timestamp('disabled_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('oauth_clients_enabled_idx').on(table.disabledAt),
		check(
			'oauth_clients_client_type_check',
			sql`${table.clientType} IN ('public', 'confidential')`
		),
		check(
			'oauth_clients_auth_method_check',
			sql`${table.tokenEndpointAuthMethod} IN ('none', 'client_secret_basic')`
		)
	]
);

export const oauthArtifacts = pgTable(
	'oauth_artifacts',
	{
		model: text('model').notNull(),
		idHash: varchar('id_hash', { length: 64 }).notNull(),
		payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
		grantIdHash: varchar('grant_id_hash', { length: 64 }),
		userCodeHash: varchar('user_code_hash', { length: 64 }),
		uid: text('uid'),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		consumedAt: timestamp('consumed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.model, table.idHash] }),
		index('oauth_artifacts_grant_id_idx').on(table.grantIdHash),
		uniqueIndex('oauth_artifacts_user_code_idx').on(table.userCodeHash),
		index('oauth_artifacts_uid_idx').on(table.uid),
		index('oauth_artifacts_expires_at_idx').on(table.expiresAt)
	]
);

export const oauthConsents = pgTable(
	'oauth_consents',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClients.id, { onDelete: 'cascade' }),
		resourceUri: text('resource_uri')
			.notNull()
			.references(() => oauthResources.uri, { onDelete: 'cascade' }),
		scopes: jsonb('scopes').$type<string[]>().notNull(),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex('oauth_consents_subject_client_resource_idx').on(
			table.userId,
			table.clientId,
			table.resourceUri
		)
	]
);

export const oauthAuditEvents = pgTable(
	'oauth_audit_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventType: text('event_type').notNull(),
		actorId: text('actor_id'),
		clientId: text('client_id'),
		resourceUri: text('resource_uri'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		outcome: text('outcome').notNull(),
		details: jsonb('details')
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('oauth_audit_events_created_at_idx').on(table.createdAt),
		index('oauth_audit_events_client_id_idx').on(table.clientId)
	]
);

export const oauthRateLimits = pgTable(
	'oauth_rate_limits',
	{
		bucket: text('bucket').notNull(),
		subjectHash: varchar('subject_hash', { length: 64 }).notNull(),
		windowStartedAt: timestamp('window_started_at', {
			withTimezone: true
		}).notNull(),
		requestCount: integer('request_count').default(0).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [primaryKey({ columns: [table.bucket, table.subjectHash] })]
);

export const oauthSigningKeys = pgTable('oauth_signing_keys', {
	kid: text('kid').primaryKey(),
	publicJwk: jsonb('public_jwk').$type<Record<string, unknown>>().notNull(),
	status: text('status').notNull(),
	activatedAt: timestamp('activated_at', { withTimezone: true }).notNull(),
	retiredAt: timestamp('retired_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull()
});
