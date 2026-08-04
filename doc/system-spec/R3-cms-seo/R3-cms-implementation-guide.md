# R3 Implementation Guide: CMS

This guide provides a step-by-step verification path for implementing Milestone 3.

## Phase 1: Backend Setup (R3a)

### 1. Schema Init
```bash
# 1. Create schema file
touch apps/api/src/core/domain/cms/cms.schema.ts
# 2. Add 'posts' and 'post_contents' definitions
# 3. Generate migrations
npm run db:generate
npm run db:migrate
```

### 2. Module Definition
*   Create `CmsModule` in `apps/api/src/core/domain/cms/cms.module.ts`.
*   Import `CmsModule` into `DomainModule`.

### 3. API & Service Stub
*   Create `CmsController` with `@Controller('cms')`.
*   Establish `CmsService` and `CmsRepository` extending BaseRepository.
*   **Tip**: Use `DrizzleRepository` pattern for type-safe queries.

---

## Phase 2: Frontend Editor (R3a)

### 1. Dependency
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image
```

### 2. Component Construction
*   Create `@share/ui/editor/TiptapEditor.tsx`.
*   Implement `MenuBubble` for quick formatting.
*   Ensure `onChange` prop returns JSON.

### 3. Page Assembly
*   Link Admin Route `/admin/cms/posts`.
*   Connect API client `sdk.cms.getPosts()`.

---

## Phase 3: Public Rendering (R3b)

### 1. Next.js Route
*   File: `apps/web/app/blog/[slug]/page.tsx`.
*   Use `generateMetadata` for SEO dynamic tags.

### 2. Tiptap Rendering
*   Use `editor-content` CSS class for styling HTML output from JSON.
*   Ensure strict sanitization if rendering HTML strings (though Tiptap JSON is generally safer).

---

## Phase 4: Assets (R3c)

### 1. File Upload
*   Use `multer` or `Busboy` (NestJS standard) for `POST /assets/upload`.
*   Store files in `apps/api/uploads` (for R3) or S3 (Future).
*   Serve files via Static Assets middleware in NestJS.

---

## QC Checklist (Self-Check)

- [ ] Does `POST /cms/posts` reject invalid JSON?
- [ ] Does `GET /public/posts/:slug` return 404 for drafts?
- [ ] Can I edit Japanese content while keeping English content intact?
