import { pgTable, uuid, varchar, bigint, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from '@platform/nest-identity-users';

export const assets = pgTable('assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    storageProvider: varchar('storage_provider', { length: 20 }).notNull(), // 's3', 'minio', 'gcs'
    bucket: varchar('bucket', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'ready', 'deleted'
    mimeType: varchar('mime_type', { length: 100 }),
    size: bigint('size', { mode: 'number' }),
    ownerId: integer('owner_id').references(() => users.id),
    visibility: varchar('visibility', { length: 20 }).default('public').notNull(), // 'public', 'private'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
