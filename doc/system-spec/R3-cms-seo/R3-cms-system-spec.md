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
