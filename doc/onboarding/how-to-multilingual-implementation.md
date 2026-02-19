# Multilingual Implementation Guide

## 1. Overview
The R3 CMS uses a **One-to-Many** relationship for localization:
- **`posts` table**: Contains language-agnostic metadata (ID, Slug, Author, Status).
- **`post_contents` table**: Contains language-specific content (Title, Body, SEO).

## 2. Backend Implementation (NestJS)

### 2.1 Database Schema
We rely on a composite unique constraint `(post_id, locale)` to ensure one entry per language per post.

```typescript
// post_contents schema
export const postContents = pgTable('post_contents', {
  postId: uuid('post_id').references(() => posts.id),
  locale: varchar('locale', { length: 10 }).notNull(), // e.g., 'en', 'zh-TW'
  title: text('title'),
  body: jsonb('body'), // Tiptap JSON
  seoTitle: text('seo_title'),
  seoDesc: text('seo_desc'),
}, (t) => ({
  pk: primaryKey(t.postId, t.locale), // Composite PK
}));
```

### 2.2 API Design
- **GET /cms/posts/:id?locale=zh-TW`:
    - Logic: Fetch `posts` row + `post_contents` row where `locale = query.locale`.
    - If `post_contents` is missing (e.g., new translation), return empty content structure to Frontend (don't create DB row yet).

- **PATCH /cms/posts/:id`:
    - Payload: `{ locale: 'zh-TW', title: '...', body: ... }`
    - Logic: **Upsert** (Insert or Update) into `post_contents` based on `(post_id, locale)`.

## 3. Frontend Implementation (SvelteKit)

### 3.1 Managing Locale State
Use a URL-based source of truth for the active locale editor.

```typescript
// Svelte Store or URL State
let activeLocale = $page.url.searchParams.get('locale') || 'en';

function switchLocale(newLocale) {
  goto(`?locale=${newLocale}`, { replaceState: true });
  // Trigger fetchContent(postId, newLocale);
}
```

### 3.2 Editor Behavior
- **Switcher**: A dropdown in the Editor Sidebar.
- **Content Loading**:
    1. User switches locale.
    2. Editor fetches content for that locale.
    3. If content exists -> Load into Tiptap.
    4. If content is empty -> Show "Start writing in [Language]..." placeholder.
    5. **Save**: When user saves, send the **current active locale** in the payload.

### 3.3 Public View (SSR)
- Next.js / SvelteKit Public Page: `/[locale]/blog/[slug]`
- SEO: Ensure `<link rel="alternate" hreflang="..." />` tags are generated linking to other locales of the same `post_id`.
