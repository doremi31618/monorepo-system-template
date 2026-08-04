# R3 CMS Technical Specification (v2.0)

## 1. 系統架構 (System Architecture)

採用 **Headless CMS** 架構，確保內容管理與前端呈現解耦。

* **Admin SPA**: React/Next.js (Client-side) + Tiptap Editor。
* **Backend API**: Node.js/NestJS (提供 RESTful API)。
* **Database**: PostgreSQL (處理結構化數據與多語系)。
* **Asset Storage**: S3-Compatible Cloud Storage (R3c)。

---

## 2. 資料庫設計 (Database Schema)

為了支援 Block-based 編輯與高效檢索，調整後的 Schema 如下：

### 2.1 `posts` (元數據表)

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK |  |
| `slug` | VARCHAR(255) | Unique, Index | 全站唯一識別碼 |
| `status` | ENUM | 'draft', 'published' |  |
| `author_id` | UUID | FK | 關聯用戶表 |
| `published_at` | TIMESTAMP | Nullable | 發佈時間 |

### 2.2 `post_contents` (多語系內容表)

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `post_id` | UUID | FK, Index | 關聯 `posts.id` |
| `locale` | VARCHAR(10) | Index | 如 'en', 'zh-TW' |
| `title` | TEXT |  | 文章標題 |
| `body` | **JSONB** |  | **Tiptap JSON Structure (Block Tree)** |
| `seo_title` | TEXT |  | SEO 標題 |
| `seo_desc` | TEXT |  | SEO 描述 |

> **Note**: `body` 存儲為 JSONB 以便於直接映射到編輯器的 Block 結構，並支援資料庫層級的全文檢索。

### 2.3 `assets` (資源表)

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | PK |
| `storage_provider` | VARCHAR | 's3', 'gcs', 'minio' |
| `bucket` | VARCHAR |  |
| `storage_key` | VARCHAR |  |
| `status` | ENUM | 'pending', 'ready', 'deleted' |
| `mime_type` | VARCHAR |  |
| `size` | BIGINT |  |
| `owner_id` | UUID | FK |
| `visibility` | ENUM | 'public', 'private' |

---

## 3. 編輯器實作：Notion-like Experience

### 3.1 核心組件堆疊 (Tech Stack)

* **Editor Core**: `Tiptap` (基於 ProseMirror)。
* **Drag & Drop**: `dnd-kit` 或 `ProseMirror-drag-drop`。
* **Block Component**: 自定義 Tiptap `Node`，每個節點封裝在一個帶有 `DragHandle` 的 React 元件中。

### 3.2 拖拽邏輯 (D&D Mechanism)

1. **節點封裝**: 每個區塊 (Paragraph, Image, Heading) 都被視為一個獨立的 `Node`。
2. **Handle 觸發**: 只有滑鼠 Hover 在 `DragHandle` (⠿) 上時才允許啟動拖拽。
3. **ProseMirror 變更**: 拖拽結束後，透過 `transaction` 調用 `tr.moveNode(from, to)` 更新文件狀態。

---

---

## 4. 資源上傳 (R3c Asset Integration)

### 4.1 儲存策略 (Object Storage Optimization)
為確保 Cloud (S3/GCS) 與 On-prem (MinIO) 行為一致，**全面採用 Object Storage 直傳模式**。
*   **不使用** `localfs` 作為主要儲存，開發環境建議使用 MinIO (Docker)。
*   **前端直傳**: 瀏覽器直接 PUT 到 Storage，後端僅負責簽章 (Presigned URL)。

### 4.2 直傳流程 (Direct Upload Flow)

1.  **Init (`POST /v1/cms/assets/init`)**
    *   Payload: `{ filename, mime, size }`
    *   Backend: 生成 `asset_id`, `storage_key`, `upload_url` (PUT signed url)。
    *   Response: `{ asset_id, upload_url, storage_key }`

2.  **Direct Upload (Frontend)**
    *   Frontend 使用 `PUT upload_url` 上傳檔案 (帶 Content-Type)。

3.  **Complete (`POST /v1/cms/assets/:id/complete`)**
    *   Backend: 對 Storage 發起 `HEAD` 請求驗證檔案存在與 Size/Etag。
    *   Backend: 更新 Asset Status 為 `ready`。

4.  **Get URL (`GET /v1/cms/assets/:id/url`)**
    *   Response: `{ url }` (GET signed url, short-lived)。

### 4.3 介面定義 (IStorageStrategy)
*   `presignPut(key: string, mime: string): Promise<string>`
*   `presignGet(key: string): Promise<string>`
*   `head(key: string): Promise<Metadata>`
*   `delete(key: string): Promise<void>`

1. **Drop Event**: 監聽編輯器區塊的 `drop` 事件。
2. **Optimistic UI**:
* 在編輯器內立即插入一個 `ImageBlock`，顯示 **Loading 狀態**。
* 後台異步調用 `POST /v1/cms/assets/upload`。


3. **Finalization**:
* 上傳成功後，後端回傳 `file_id` 與 `storage_key`。
* 更新 Tiptap JSON 中的 `src` 屬性，移除 Loading 標籤。



---

## 5. API 定義 (API Endpoints)

### 5.1 Admin CMS API (Protected)

* `PATCH /v1/cms/posts/:id`
* **Payload**: `{ locale: 'zh-TW', title: '...', body: { ...JSON... } }`
* **Logic**: 僅更新 `post_contents` 對應語系的欄位。


#### Publishing
- `POST /posts/:id/publish` - Change status to `published`.
- `POST /posts/:id/unpublish` - Revert to `draft`.

#### Assets (Direct Upload)
- `POST /assets/init` - Get presigned PUT URL.
- `POST /assets/:id/complete` - Verify and mark as ready.
- `GET /assets/:id/url` - Get presigned GET URL.
- `DELETE /assets/:id` - Delete file.
- `GET /assets` - List files.

#### Delete Behavior (新增規格)
- `DELETE /v1/cms/posts/:id`
  - 行為: Hard delete `posts` 與該文章所有 `post_contents` (所有 locale)。
  - 回傳: `{ id, deleted: true }`。
  - UI: Admin 文章列表需顯示刪除按鈕與確認視窗。
- `DELETE /v1/cms/assets/:id`
  - 行為: 刪除 object storage 檔案後，移除 `assets` 資料列。
  - 回傳: `{ id, deleted: true }`。
  - UI: Asset 管理列表需顯示刪除按鈕與確認視窗。

### 5.2 Public API (Optimized)

* `GET /v1/public/posts/slug/:slug?locale=zh-TW`
* **Caching**: 使用 Redis 緩存已發佈的內容。
* **Response**: 包含 SEO 欄位與結構化 JSON 內容，由前端渲染。



---

## 6. SEO 與效能優化 (Technical SEO)

* **SSR (Server Side Rendering)**: 前端必須使用 Next.js 或類似框架，在伺服器端將 `body` JSON 轉換為語義化的 HTML（使用 `Tiptap GenerateHTML` 函式）。
* **Open Graph**: 動態生成 `<meta property="og:image">`，若無專屬 SEO 圖則抓取文章第一張圖片。
* **Canonical URL**: 自動生成 `<link rel="canonical">` 避免多語系內容造成的重複頁面問題。

---

## 7. 驗收與性能指標

* **Payload Size**: 單次 `body` 更新建議壓縮在 500KB 以內。
* **API Latency**: 公開檢索 API (Cache Hit) 需在 **50ms** 內響應。
* **Editor FPS**: 在包含 50+ 區塊的文章中，拖拽延遲需低於 **16ms**。

---

**下一步建議：**

1. 是否需要我提供 **Tiptap Custom Node (Draggable Block)** 的具體程式碼實作範例？
2. 是否需要設計 **自動保存 (Debounce Save)** 的前端狀態機邏輯？

---

## 8. Incremental Technical Spec (2026-02-18)

### 8.1 Schema Changes
- `assets`
  - 新增 `original_name` (`varchar(255)`, nullable): 保留原始檔名，供名稱查詢。
- 新增 `cms_tags`
  - `id` (uuid pk), `name` (unique), `slug` (unique), `created_at`, `updated_at`。
- 新增 `post_tags`
  - `post_id` + `tag_id` 複合主鍵。
  - FK: `post_id -> posts.id`, `tag_id -> cms_tags.id`，`ON DELETE CASCADE`。

### 8.2 Backend API Contract
- `GET /v1/cms/posts`
  - Query: `page`, `limit`, `locale`, `query`, `status`, `tagId`
  - 行為：支援標題/slug 名稱查詢、狀態篩選、tag 篩選。
- `PUT /v1/cms/posts/:id/tags?locale=...`
  - Payload: `{ tagIds: string[] }`
  - 行為：覆蓋更新文章 tag 關聯。
- `GET /v1/cms/tags?query=...`
  - 行為：回傳 tag 列表與 `postCount`。
- `POST /v1/cms/tags`
  - Payload: `{ name: string }`
  - 行為：建立 tag（slug 自動生成，衝突時自動附加序號）。
- `GET /v1/cms/assets`
  - Query: `page`, `limit`, `query`, `status`, `mimePrefix`
  - 行為：支援資產名稱/狀態查詢，並可依 MIME 前綴過濾（例如 `image/`）。

### 8.3 Frontend Integration
- CMS 列表：新增 `query/status/tag` 篩選列。
- Asset 列表：新增 `query/status` 篩選列。
- 新增 `AssetPickerModal`：
  - Modal 內可搜尋既有圖片，並可上傳新圖片。
  - 上傳成功後直接可回傳該圖片 URL。
- CMS 編輯頁：
  - Cover Image 改用 `AssetPickerModal`。
  - Tiptap 插圖命令改為呼叫 Modal 選圖/上傳（若未提供 callback 才退回 URL prompt）。
  - 新增 Tag 區塊（tag list、勾選、建立新 tag）。

### 8.4 QA Checklist
- CMS 查詢：`query/status/tag` 三種條件可單獨/組合工作。
- Asset 查詢：`query/status` 可單獨/組合工作。
- Cover Image：可從「上傳」與「既有圖片」完成設定。
- 內文插圖：slash image 命令可開啟 modal，插入後 Tiptap JSON 正確更新。
- Tag：可建立、選取、儲存、重新載入後正確回顯。

## 9. Incremental Technical Spec (2026-02-18-B)

### 9.1 Schema Changes
- `post_contents`
  - 新增 `link_preview_url` (`text`, nullable)
  - 新增 `link_preview_title` (`text`, nullable)
  - 新增 `link_preview_description` (`text`, nullable)
  - 新增 `link_preview_image` (`text`, nullable)
- Migration:
  - `apps/api/drizzle/0013_spicy_medusa.sql`

### 9.2 Backend API Contract
- `GET /v1/cms/posts`
  - Query 新增：`updatedFrom`, `updatedTo`
  - 行為：以 `posts.updated_at` 做日期區間過濾（可與 `query/status/tagId` 組合）。
- `GET /v1/cms/tags?query=...`
  - 回傳格式統一為 `{ data: Tag[] }`，便於前端列表頁一致處理。
- `PUT /v1/cms/tags/:id`
  - Payload: `{ name?: string }`
  - 行為：更新 tag 名稱並重新產生唯一 slug。
- `DELETE /v1/cms/tags/:id`
  - 行為：刪除 tag；`post_tags` 透過 FK cascade 清理關聯。
- `GET /v1/cms/link-preview?url=...`
  - 行為：擷取遠端頁面 Open Graph / meta 資訊。
  - 回傳：`{ url, title, description, image, siteName }`
  - 安全限制：
    - 僅允許 `http/https`
    - 阻擋 localhost / private network host
    - 7 秒 timeout，且限定 `text/html`

### 9.3 Frontend Integration
- CMS 列表頁
  - 新增日期區間欄位（From / To）並送出到 `getPosts`.
  - 支援 `query + status + tag + date range` 組合搜尋。
- CMS Tag 管理區
  - 提供查詢、新增、編輯、刪除完整 CRUD 介面。
- CMS 編輯頁（`/admin/cms/[id]`）
  - 新增 Link Preview 區塊：
    - URL 輸入
    - Fetch（呼叫 `GET /cms/link-preview`）
    - Clear
    - 卡片預覽（image/title/description/url）
  - Save 時一併寫入 `linkPreview*` 欄位。

### 9.4 QA Checklist
- CMS 搜尋：
  - 關鍵字、狀態、日期、tag 單條件可正確查詢。
  - 條件組合查詢結果符合預期。
- Tags CRUD：
  - 新增/編輯/刪除後列表即時更新，文章 tag 關聯可正常同步。
- Link Preview：
  - 合法 URL 可抓到 title/description/image。
  - 清空後保存並重整，資料確實清除。
  - 非法或不可抓取 URL 會顯示錯誤訊息，不造成頁面崩潰。

## 10. Incremental Technical Spec (2026-02-18-C)

### 10.1 CMS Admin Tabs
- 前端 `GET /admin/cms` 頁面改用本地 tab state 切換兩個區塊：
  - `posts`：文章搜尋/列表。
  - `tags`：tag 搜尋與 CRUD。
- 切換 tab 僅控制顯示，不重置已輸入的查詢與編輯狀態。

### 10.2 Asset Update API
- 新增 `PUT /v1/cms/assets/:id`
  - Payload: `{ originalName?: string; status?: 'pending' | 'ready' }`
  - 行為：
    - 驗證資產存在。
    - `originalName` 若有提供，不可為空字串。
    - `status` 若有提供，只允許 `pending` / `ready`。
    - 更新後回傳最新 asset。
- 前端 Asset 管理頁新增 inline 編輯流程：
  - 進入編輯（Edit icon）→ 修改名稱/狀態 → Save / Cancel。

### 10.3 Post Slug Editable + Validation
- `PATCH /v1/cms/posts/:id/status`
  - 既有 `slug` 參數改為正式支援編輯：
    - 正規化（lowercase、空白轉 `-`、移除非法字元）。
    - 不可為空。
    - 需驗證唯一性（排除自身 post id）。
  - `status` 僅允許 `draft` / `published` / `archived`。
  - 回傳單一更新後 post 物件。
- CMS 編輯頁在 Save 與 Status 變更時，都需帶入目前 slug 以確保一致寫入。

### 10.4 QA Checklist
- CMS tab 切換：
  - Post List / Tag List 可正確切換顯示。
- Asset 編輯：
  - 名稱與狀態可更新且列表即時反映。
  - 空名稱或非法狀態會被後端拒絕。
- Post slug：
  - 可輸入新 slug 並成功保存。
  - 重複 slug 會回傳錯誤，不覆蓋既有資料。

## 11. Incremental Technical Spec (2026-02-18-D)

### 11.1 Editor-native Link Preview
- 新增 Tiptap 自訂 block node：`linkPreview`
  - attrs: `url`, `title`, `description`, `image`, `siteName`
  - 儲存在 `post_contents.body` 的 Tiptap JSON 內。
- 自動轉換策略：
  - `paste` URL 時攔截並插入 `linkPreview` node。
  - 在段落中輸入 URL 後按 Enter 時，將該段落替換為 `linkPreview` node。
- metadata 來源：沿用 `GET /v1/cms/link-preview?url=...`。

### 11.2 URL Rebind（更換網址）
- `linkPreview` node view 需提供 `Change URL` action。
- 更換網址後流程：
  - 清空舊 metadata attrs。
  - 重新請求 `link-preview` API。
  - 以新結果更新 node attrs（url/title/description/image/siteName）。

### 11.3 Frontend Integration
- `TiptapEditor` 新增 prop：
  - `onRequestLinkPreview?: (url: string) => Promise<LinkPreviewPayload | null>`
- CMS 編輯頁：
  - 移除右側設定欄 Link Preview 手動區塊。
  - 透過 callback 將 `getLinkPreview` 注入 `TiptapEditor`。
- Public Preview 頁：
  - 直接渲染 editor body 中的 `linkPreview` block，不再依賴額外欄位卡片。

### 11.4 QA Checklist
- 在 editor 貼上 URL，應立即轉換為 Link Preview 卡片。
- 在 editor 輸入 URL 並按 Enter，應轉換為 Link Preview 卡片。
- 點擊 `Change URL` 後可成功更新卡片內容。
- 儲存後重新打開文章，Link Preview 卡片仍存在且資料正確。

## 12. Incremental Technical Spec (2026-02-18-E)

### 12.1 `linkPreview` Node Attr 擴充
- `linkPreview` attrs 新增：
  - `size: 'small' | 'medium' | 'large'`（default: `medium`）
- `size` 寫入 `post_contents.body`（Tiptap JSON）並隨文章內容保存。

### 12.2 NodeView 尺寸控制
- `linkPreview` node view 增加卡片內尺寸控制按鈕群（`S/M/L`）。
- 點擊尺寸按鈕時，使用 `setNodeMarkup` 更新當前 node 的 `size` attr。
- 在 `editable = false` 情境：
  - 隱藏尺寸控制與編輯動作按鈕（`Change URL`）。
  - 保留卡片渲染與連結行為。

### 12.3 Rendering 與樣式策略
- node view 將 `size` 同步到卡片 `data-size`。
- 透過 CSS selector 定義三種視覺尺寸：
  - `small`：較小 max-width、較低圖片高度、較小字級與內距。
  - `medium`：沿用既有樣式（預設）。
  - `large`：全寬、較高圖片高度、較大字級與內距。

### 12.4 QA Checklist
- 在 editor 內可對單一 Link Preview 卡片切換 S/M/L，且立即反映樣式。
- 切換尺寸後儲存文章並重新開啟，尺寸設定不遺失。
- 在 public preview 頁面可顯示正確尺寸，且不出現尺寸切換控制。

## 13. Incremental Technical Spec (2026-02-18-F)

### 13.1 Schema Changes
- `posts`
  - 新增 `view_count` (`integer`, default `0`, not null)。
- Migration:
  - `apps/api/drizzle/0014_faithful_bloodstrike.sql`

### 13.2 Backend API Contract
- 新增 Public CMS API（不需後台頁）：
  - `GET /v1/cms/public/posts`
    - Query: `page`, `limit`, `locale`, `query`, `tagSlug`, `sort(latest|popular)`
    - 回傳已發佈文章列表（含 `viewCount`, `excerpt`, `tags`）。
  - `GET /v1/cms/public/posts/:slug`
    - 依 slug 取得單篇已發佈文章。
  - `POST /v1/cms/public/posts/:slug/view`
    - 累加文章點閱數並回傳最新 `viewCount`。
  - `GET /v1/cms/public/home`
    - 回傳首頁資料：`latestPosts` + `hotTags`（含各 tag 的 `totalViews` 與熱門文章）。
- 既有後台 API 擴充：
  - `GET /v1/cms/posts` 回傳 `viewCount`。
  - `GET /v1/cms/tags` 回傳 `totalViews`（tag 下文章點閱總和）。

### 13.3 Editor & Frontend Integration
- `TiptapEditor` 新增 block node：`tableOfContents`
  - 可由 slash/floating/mobile menu 插入。
  - 以 atom node 儲存在 Tiptap JSON。
- CMS 編輯頁（`/admin/cms/[id]`）
  - 解析 editor body 的 heading，渲染右側 hover-expand TOC 面板。
  - 僅在內容包含 `tableOfContents` node 時顯示面板。
- 新增 public routes：
  - `/blog`：文章列表頁。
  - `/blog/[slug]`：文章詳情頁。
- 首頁 `/` 改用 public home API 顯示：
  - 最新文章列表。
  - 熱門 tag（含該 tag 的熱門文章）。

### 13.4 QA Checklist
- Editor 可插入 TOC block，並在右側看到可展開目錄。
- `/blog` 可載入已發佈文章列表；點擊後可進入 `/blog/:slug`。
- 進入文章頁後點閱數會累加，回到 CMS 列表可看到 post/tag 點閱統計變化。
- 首頁可正確渲染最新文章與熱門 tag 區塊資料。

## 14. Incremental Technical Spec (2026-02-18-G)

### 14.1 Schema Changes
- 新增 `post_daily_views`
  - `post_id` (`uuid`, FK -> `posts.id`, `ON DELETE CASCADE`)
  - `view_date` (`date`)
  - `view_count` (`integer`, default `0`, not null)
  - `created_at`, `updated_at`
  - PK: (`post_id`, `view_date`)
- migration:
  - `apps/api/drizzle/0015_*.sql`（由 drizzle generate 產生）

### 14.2 Backend API Contract
- 新增 Dashboard API：
  - `GET /v1/cms/dashboard/analytics`
    - Query: `locale`, `days`, `topLimit`
    - Response:
      - `dailyViews: [{ date, views }]`
      - `topPosts: [{ id, slug, title, viewCount, publishedAt, updatedAt }]`
      - `topTags: [{ id, name, slug, totalViews, postCount }]`
- 新增穩定圖片入口：
  - `GET /v1/cms/assets/:id/public`
    - 行為：後端即時產生 storage signed GET URL，並以 redirect 回應。
    - 用途：前端 `<img src>` 使用穩定 URL，不直接儲存短效簽名網址。

### 14.3 View Tracking Persistence
- `POST /v1/cms/public/posts/:slug/view`
  - 除了累加 `posts.view_count`，同步 upsert `post_daily_views` 當日數據：
    - 若 (`post_id`, `view_date`) 已存在：`view_count + 1`
    - 否則新增當日記錄

### 14.4 TOC Rendering Behavior
- `tableOfContents` node view 不再只顯示說明文案，改為直接渲染 H1/H2/H3 清單。
- 清單支援點擊跳轉至對應標題。
- 右側 hover TOC 面板保留；兩者同時可見。

### 14.5 Preview Mode Behavior
- `TiptapEditor` 在 `editable=false` 時：
  - Bubble menu `shouldShow` 必須回傳 `false`。
  - 不顯示任何編輯工具控制（含文字格式 bubble）。

### 14.6 Image URL Compatibility Strategy
- 新增「舊簽名 URL 相容轉換」：
  - 讀取文章內容時，若偵測到 storage endpoint 的簽名 URL，會透過 `storage_key` 反查 asset，轉成 `/v1/cms/assets/:id/public`。
  - 轉換範圍包含：
    - `post_contents.cover_image`
    - Tiptap body image node `attrs.src`
    - `linkPreview.image`（若來源為資產）
- 新增/選取資產時前端直接寫入穩定 URL，避免再持久化短效簽名網址。

### 14.7 QA Checklist
- Dashboard API 可回傳指定天數的每日點擊資料與前五名排行。
- 觸發 post view 後，`posts.view_count` 與 `post_daily_views` 同步成長。
- TOC block 本體可顯示目錄清單，右側 hover TOC 仍可操作。
- Preview 頁面選取文字不會出現 bubble menu。
- 舊文章若儲存的是過期簽名圖片 URL，前台仍可顯示圖片（透過相容轉換）。
