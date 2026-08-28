# R3 - CMS & Content Platform Project Task

> **Status**: 🚧 In Progress  
> **Objective**: Build a content platform governed by RBAC, extensible for multilingual support, and publishable.  
> **Based on**: [R3-cms-seo.md](../Roadmap/R3-cms-seo.md)
> **Last updated**: 2026-02-18

## 📌 今日工作進度（2026-02-18）

- 完成 DB migration 執行，新增每日點擊統計資料表 `post_daily_views`。
- 新增後台 Dashboard 統計 API 與頁面：
  - 每日點擊數量
  - Top 5 熱門文章
  - Top 5 熱門 Tag
- 完成前台發布頁串接：
  - `/blog` 文章列表頁
  - `/blog/[slug]` 文章詳情頁
  - 首頁 Latest Posts 與 Hot Tags 元件
- 修正 TOC 規格落差：TOC 現在同時顯示於
  - 右側 hover 目錄
  - TOC 元件本體清單
- 修正 Preview 模式：`editable=false` 時不再顯示 bubble editor。
- 修正前台圖片失效：改為穩定 asset URL（`/v1/cms/assets/:id/public`），並相容舊 signed URL 內容。
- 更新產品/技術規格文件（R3 Incremental G）。

---

## 📅 Overview

| Sub-Milestone | Name | Scope | Progress |
|---|---|---|---|
| **R3a** | CMS Core (Internal) | Data Model, API, Admin UI, RBAC | 🟡 進行中（核心功能已落地） |
| **R3b** | Public Publish | Public Route, SSR, SEO Metadata | 🟡 進行中（Public API/頁面已落地） |
| **R3c** | Assets & Dict | File Upload, Dictionary Model | 🟡 進行中（Assets 已落地，Dictionary 未開始） |

---

## 🏗️ R3a: CMS Core (Internal Authoring)

### 1. Database & Models
- [x] **Schema Design**: Define `posts` table (metadata).
- [x] **Schema Design**: Define `post_contents` table (t.json, locale).
- [x] **Migration**: Create migration file for CMS tables.
- [ ] **Repository**: Implement `CmsRepository` (Drizzle)。
- [ ] **Seeding**: Seed initial test data (optional).

### 2. CMS Admin API
- [x] **Module Setup**: Create `CmsModule` in backend.
- [x] **Controller**: Implement `CmsController` (`/cms/posts`).
- [x] **Service**: Implement CRUD logic in `CmsService`.
- [ ] **RBAC**: Define permissions (`cms.post.read`, `create`, `update`, `delete`, `publish`)。
- [ ] **Guard**: Apply `RBACGuard` to all CMS endpoints。
- [ ] **Validation**: Add Zod/DTO validation for request bodies。

### 3. Admin UI (Frontend)
- [x] **Menu**: Add "Content" or "Posts" item to Admin Sidebar.
- [x] **Post List**: Create `PostListPage` (datatable, status badge, locale + search/filter/tag/date)。
- [x] **Post Editor Layout**: Create `PostEditorPage` (main editor + sidebar)。
- [x] **Tiptap Integration**: Integrate Tiptap editor for content area。
- [ ] **Auto-save**: Implement `useAutoSave` hook。
- [x] **Metadata Sidebar**: Implement title, slug, status, toggle inputs。

### 4. Integration
- [x] **Content API Client**: 完成 frontend CMS API client（`$lib/api/cms.ts`）。
- [ ] **Permission Check**: Hide "Publish" button if no permission。

---

## 🚀 R3b: Public Publish & SEO

### 1. Public API & Routing
- [x] **Public API**: Implement `GetPostBySlug` (public endpoint)。
- [ ] **Preview Mode**: Implement `preview_token` validation。
- [x] **Public Pages (SvelteKit)**: 已完成 `/blog` 與 `/blog/[slug]`。

### 2. Rendering & SEO
- [ ] **Metadata**: 補齊 public 頁面 `title/description/og`。
- [x] **Tiptap Renderer**: Public 端已可渲染 Tiptap JSON（read-only editor）。
- [x] **Fallback**: Handle 404 for draft/non-existent posts。
- [x] **Homepage Components**: 首頁已上線 Latest Posts + Hot Tags（依 tag 總點閱排序）。

### 3. Analytics
- [x] **Post Views**: 公開文章頁可累加文章點閱（`posts.view_count`）。
- [x] **Daily Views**: 同步聚合 `post_daily_views` 每日數據。
- [x] **Dashboard API/UI**: 已提供每日點閱、Top 5 文章、Top 5 Tags。

---

## 🗄️ R3c: Platform Assets & Dictionary

### 1. Asset Management
- [x] **Schema**: 定義資產表（目前使用 `assets`）。
- [x] **Upload API**: Implement upload flow (`/cms/assets/upload` + init/complete/url/public)。
- [ ] **Local Adapter**: Implement Local Storage adapter (Disk)。
- [x] **Editor Plugin**: Add Image Upload button/flow to Tiptap toolbar。

### 2. Dictionary (Terms)
- [ ] **Schema**: Define `dictionary_terms` table。
- [ ] **Read API**: Implement `GET /dictionary` (cached)。
- [ ] **Frontend Hook**: Create `useDictionary('scope')` hook。

---

## ✅ QA & Verification
- [ ] **Unit Tests**: Test `CmsService` logic。
- [ ] **E2E Tests**: Test Admin CMS flows (Create -> Publish -> View)。
- [x] **Manual QA**: 已建立並執行手動驗收清單（TOC / blog / views / hot tags）。

---

## 📝 Working Diary

### 2026-02-18
- **DB**: 執行 migration，新增 `post_daily_views`，並驗證 migration success。
- **Backend**:
  - 新增 `GET /v1/cms/dashboard/analytics`。
  - 新增 `GET /v1/cms/assets/:id/public`（穩定圖片入口）。
  - `POST /v1/cms/public/posts/:slug/view` 同步寫入每日點擊聚合。
  - 加入舊 signed URL -> 穩定 URL 相容轉換（cover/body/linkPreview image）。
- **Frontend**:
  - 新增後台 Dashboard 統計頁。
  - 新增前台 `/blog`、`/blog/[slug]` 與首頁 Latest/Hot Tags 內容模組。
  - TOC 元件本體可直接顯示目錄項目並支援跳轉。
  - Preview 模式隱藏 bubble editor。
  - Asset Picker / Asset 預覽 / BlockEditor 改存與改用穩定圖片 URL。
- **Spec**:
  - 更新 `R3-cms-product-spec.md` Incremental G。
  - 更新 `R3-cms-system-spec.md` Incremental G。
- **Verification**:
  - `backend build` 成功。
  - `frontend check` 無 error（保留既有 warning）。
  - API 驗證 dashboard 統計、點擊累加與圖片 URL 轉換正常。

---

## 📋 更新後工作清單（Next）

### P0（優先）
- [ ] 套用 CMS RBAC 權限與 Guard（`cms.post.*`, `cms.asset.*`, `cms.tag.*`）。
- [ ] 補齊 CMS Controller/Assets Controller DTO validation。
- [ ] 針對 dashboard、image URL conversion、TOC node 補單元測試。
- [ ] 補齊上傳/選圖/前台渲染的回歸測試，避免圖片 URL 再次失效。

### P1（近期）
- [ ] 補上 Auto-save（debounce + dirty state + failure retry）。
- [ ] Public 頁面 SEO metadata（title/description/og）。
- [ ] 完成 CMS flows E2E（Create/Post/Tag/Asset/Delete/Publish/View）。
- [ ] 清理 frontend check 既有 warning（分批處理，先型別與未使用變數）。

### P2（後續）
- [ ] Dictionary module（schema/API/frontend hook）。
- [ ] 補齊 Preview token 機制（草稿安全預覽）。
