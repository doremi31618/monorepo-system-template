# R3 Implementation Guide: CMS

This guide describes the current SvelteKit/NestJS capability implementation for Milestone 3.

## Phase 1: Backend capability

CMS contracts and pure utilities are owned by `packages/cms`; the NestJS/Drizzle adapter is owned by `packages/nest-cms`:

```text
packages/nest-cms/src/cms.schema.ts
packages/nest-cms/src/cms.service.ts
packages/nest-cms/src/cms.module.ts
packages/nest-cms/src/cms.controller.ts
packages/nest-cms/src/cms-public.controller.ts
```

After changing a CMS or asset schema, generate and apply the canonical migration from the repository root:

```bash
bun run db:generate
bun run db:migrate
```

Do not create a second migration history for the platform database.

## Phase 2: SvelteKit editor

- Editor component: `apps/web/src/lib/components/editor/TiptapEditor.svelte`.
- Admin list: `apps/web/src/routes/admin/cms/+page.svelte`.
- Admin editor: `apps/web/src/routes/admin/cms/[id]/+page.svelte`.
- Browser API client: `apps/web/src/lib/api/cms.ts`.

The editor emits Tiptap JSON. Keep toolbar, block-menu, autosave, preview, and status changes in the Svelte feature boundary; shared visual primitives remain in `packages/ui` or `packages/service-ui`.

## Phase 3: Public rendering and SEO

- Public list: `apps/web/src/routes/blog/+page.svelte`.
- Public detail: `apps/web/src/routes/blog/[slug]/+page.svelte`.
- Public API: `GET /v1/cms/public/posts` and `GET /v1/cms/public/posts/:slug`.

Render only published posts. Set title, description, canonical URL, and social metadata through SvelteKit's `<svelte:head>`. Sanitize any generated HTML before using `{@html ...}`; prefer structured Tiptap JSON rendering where practical.

## Phase 4: Assets

Asset schema and storage adapters live in `packages/assets`. Browser uploads use the flow implemented in `apps/web/src/lib/api/assets.ts`:

1. `POST /v1/cms/assets/init` returns an upload URL.
2. The browser uploads directly to the S3-compatible storage endpoint.
3. `POST /v1/cms/assets/:id/complete` marks the asset ready.

Local development uses MinIO. Do not add an `apps/api/uploads` local-filesystem authority.

## Verification

```bash
bun run build:packages
bun run --filter '@platform/web' check
bun run --filter '@platform/web' build
bun run --filter '@platform/api' test
```

- Draft posts are not available from public endpoints.
- Locale-specific content can be edited without replacing another locale.
- Public pages render saved Tiptap content and metadata.
- Asset upload completes through the configured storage adapter.
