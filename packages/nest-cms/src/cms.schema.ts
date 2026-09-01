import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  primaryKey,
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { users } from '@platform/users';

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft', 'published', 'archived'
  authorId: integer('author_id').references(() => users.id),
  viewCount: integer('view_count').default(0).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postContents = pgTable(
  'post_contents',
  {
    postId: uuid('post_id')
      .references(() => posts.id)
      .notNull(),
    locale: varchar('locale', { length: 10 }).notNull(), // e.g., 'en', 'zh-TW'
    title: text('title'),
    body: jsonb('body'), // Tiptap JSON
    coverImage: text('cover_image'),
    linkPreviewUrl: text('link_preview_url'),
    linkPreviewTitle: text('link_preview_title'),
    linkPreviewDescription: text('link_preview_description'),
    linkPreviewImage: text('link_preview_image'),
    seoTitle: text('seo_title'),
    seoDesc: text('seo_desc'),
    htmlContent: text('html_content'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.locale] }),
  }),
);

export const cmsTags = pgTable('cms_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 64 }).notNull().unique(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => cmsTags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
  }),
);

export const postDailyViews = pgTable(
  'post_daily_views',
  {
    postId: uuid('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    viewDate: date('view_date').notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.viewDate] }),
  }),
);
