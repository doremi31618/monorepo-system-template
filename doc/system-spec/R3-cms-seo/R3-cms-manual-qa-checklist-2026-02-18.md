# R3 CMS Manual QA Checklist (2026-02-18)

## Environment
- Workspace: `monorepo-system-template`
- Backend base URL: `http://localhost:3333/v1`
- DB migration command:
  - `npm --workspace backend run db:migrate`
  - Result: `migrations applied successfully!`

## Seed Data (for this QA round)
- Post A ID: `600609bd-a1f0-46db-ae35-40904f93b083`
- Post B ID: `3adb72d9-aec9-4445-803a-ac4418332f05`
- Post A slug: `qa-manual-1771387112786-a`
- Post B slug: `qa-manual-1771387112786-b`
- Tag ID: `e2cf29d9-3a24-4ac4-8a57-e79d0dae8802`
- Tag slug: `qa-tag-1771387112786`

## Acceptance Checklist

### 1. TOC hover (CMS editor right-side panel)
- Scope:
  - TOC panel should only appear when content contains `tableOfContents` node.
  - Panel should be collapsed by default and expand on hover.
- Implementation evidence:
  - `frontend/src/routes/admin/cms/[id]/+page.svelte:487` checks `hasTocBlock`.
  - `frontend/src/routes/admin/cms/[id]/+page.svelte:492` uses `group-hover:w-64 group-hover:opacity-100`.
  - `frontend/src/lib/features/cms/toc.ts:80` detects `tableOfContents` node.
- Data evidence:
  - `GET /cms/public/posts/qa-manual-1771387112786-a?locale=en` confirms body contains `tableOfContents` node.
- Manual verification steps:
  1. Open `/admin/cms/600609bd-a1f0-46db-ae35-40904f93b083`.
  2. Confirm right-side `TOC` rail is visible (desktop).
  3. Hover the rail and confirm panel expands with heading list.
- Result:
  - API/data and implementation checks: PASS
  - Visual hover interaction: requires browser click-through

### 2. `/blog` article list page
- Scope:
  - `/blog` should render public posts and support query/tag filter.
- Implementation evidence:
  - `frontend/src/routes/blog/+page.svelte:17` loads data via `listPublicPosts`.
  - `frontend/src/routes/blog/+page.svelte:73` reads `?tag=` and filters.
  - `backend/src/core/domain/cms/cms-public.controller.ts:8` provides `GET /cms/public/posts`.
- API verification:
  - `GET /cms/public/posts?page=1&limit=20&locale=en&query=QA%20Post`
  - Check result: `blog_public_list_has_posts = true`
- Result: PASS

### 3. View count statistics
- Scope:
  - Page views should increment via public endpoint and reflect in admin list.
- Implementation evidence:
  - `backend/src/core/domain/cms/cms-public.controller.ts:30` provides `POST /cms/public/posts/:slug/view`.
- API verification:
  - Called `POST /cms/public/posts/qa-manual-1771387112786-a/view` 4 times.
  - Called `POST /cms/public/posts/qa-manual-1771387112786-b/view` 2 times.
  - `GET /cms/public/posts/qa-manual-1771387112786-a?locale=en` => `viewCount = 4`
  - `GET /cms/posts?page=1&limit=50&locale=en&query=QA%20Post` => Post A `viewCount = 4`
- Result: PASS

### 4. Homepage hot tags
- Scope:
  - Homepage should show hot tags ranked by aggregated tag views.
- Implementation evidence:
  - `frontend/src/routes/+page.svelte:11` loads `getPublicHome`.
  - `frontend/src/routes/+page.svelte:89` renders `Hot Tags`.
  - `backend/src/core/domain/cms/cms-public.controller.ts:35` provides `GET /cms/public/home`.
- API verification:
  - `GET /cms/public/home?locale=en&latestLimit=10&hotTagLimit=5&hotPostPerTag=5`
  - QA tag `qa-tag-1771387112786` appears in `hotTags`.
  - Observed `totalViews = 6`, `postCount = 2`.
- Result: PASS

## Programmatic Check Snapshot
All checks are `true` for this run:
- `blog_public_list_has_posts`
- `blog_public_detail_has_toc_node`
- `view_count_incremented_postA`
- `admin_post_view_count_synced`
- `popular_sort_places_postA_first`
- `popular_sort_contains_postB_second`
- `home_hot_tag_includes_seed_tag`
- `home_hot_tag_total_views_matches_seed`
- `home_latest_contains_seed_posts`
- `tag_list_total_views_matches_seed`
