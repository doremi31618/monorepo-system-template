import { pgTable, uuid, varchar, text, timestamp, jsonb, primaryKey, integer } from 'drizzle-orm/pg-core';
import { users } from '../../domain/user/user.schema.js';

export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft', 'published', 'archived'
    authorId: integer('author_id').references(() => users.id),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postContents = pgTable('post_contents', {
    postId: uuid('post_id').references(() => posts.id).notNull(),
    locale: varchar('locale', { length: 10 }).notNull(), // e.g., 'en', 'zh-TW'
    title: text('title'),
    body: jsonb('body'), // Tiptap JSON
    coverImage: text('cover_image'),
    seoTitle: text('seo_title'),
    seoDesc: text('seo_desc'),
    htmlContent: text('html_content'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.postId, t.locale] }),
}));
