# R3 Product Specification: CMS & Content Platform

## 1. User Stories

### 1.1 As a Content Editor (Internal)
- I want to write articles in a rich text environment (Bold, Italic, Image).
- I want to save drafts automatically so I don't lose work.
- I want to manage SEO titles and descriptions separately from the content.
- I want to publish content only when it is ready.
- I want to upload images directly into the editor.

### 1.2 As a Reader (Public)
- I want to view blog posts at friendly URLs (`/blog/my-post`).
- I want to see content in my preferred language (if available).
- I want the page to load fast and be SEO friendly.

---

## 2. Admin UI Requirements

### 2.1 Editor Layout
*   **Dual-Pane Design**:
    *   **Left (Main)**: Title Input (H1 style), Tiptap Editor Canvas.
    *   **Right (Sidebar)**: Meta controls (Slug, Status, Publish Date, Locale Switcher).

### 2.2 Editor Features (Tiptap)
*   Standard formatting (B, I, U, Strike).
*   Headings (H1, H2, H3).
*   Lists (Bullet, Ordered).
*   Image Block (Upload or select from Asset library - R3c).
*   Code Block (Optional).

---

## 3. Functional Requirements

### 3.1 Content Lifecycle
1.  **Draft**: Default state. Only visible in Admin.
2.  **Published**: Visible in Public API.
3.  **Archived**: Hidden from Public, read-only in Admin (optional).

### 3.2 Multilingual Support
*   Structure allows for N locales per Post.
*   Frontend should allow switching "Editing Locale".
*   If a locale is empty, fallback content (e.g., English) or empty state is shown.

### 3.3 SEO
*   `slug` is global unique identifier.
*   SSR page MUST output `<title>`, `<meta name="description">`, `<meta property="og:image">`.

### 3.4 Block-based Editing
這是一份根據你的初版規格，並整合了 **Notion 式拖曳體驗 (Block-based Editing)** 與 **多語系 SEO 策略** 的完整產品規格書 (Product Spec)。

這份文件將作為開發團隊（前端、後端、設計）的單一事實來源 (Single Source of Truth)。

---

# R3 CMS & Content Platform - 產品規格書 (v2.0)

## 1. 產品願景

打造一個具備 **Notion 般流暢編輯體驗** 的企業級內容管理系統，支援多語系、高效能 SEO 以及直覺的資源管理 (R3c)。

---

## 2. 使用者角色與故事 (User Stories)

### 2.1 內容編輯者 (Internal Editor)

* **區塊化創作**：我想要像 Notion 一樣，透過拖拽 `⠿` 抓手來重新排列段落、標題與圖片。
* **多語系對照**：我想要在同一個介面切換語系，並快速填寫對應的翻譯內容。
* **自動儲存**：編輯過程中系統需自動存為 `Draft`，防止因瀏覽器崩潰遺失數據。
* **資源直拖**：我能直接從桌面拖曳圖片到編輯器，自動觸發上傳並插入。

### 2.2 讀者 (Public Reader)

* **極速載入**：頁面需透過 SSR 達成秒開。
* **在地化 URL**：能根據語系看到對應的 URL（例如 `/zh-tw/blog/post-1`）。

---

## 3. 功能需求 (Functional Requirements)

### 3.1 核心編輯器 (Block-based Editor)

* **Notion 式互動**：
* 每個節點（段落、H1-H3、圖片、列表）皆為一個可獨立拖拽的 **Block**。
* Hover 顯示 `⠿` (Drag Handle) 與 `+` (Quick Insert)。


* **多媒體處理**：
* 支援拖入圖片、貼上圖片連結。
* 圖片區塊支援 `Alt Text` 編輯（SEO 必要）。


* **自動存檔 (Auto-save)**：每 30 秒或停止輸入 2 秒後觸發 `PATCH /posts/:id`。

### 3.2 多語系管理 (Internationalization)

* **Locale 狀態**：每個語系內容獨立存儲於 `post_contents`。
* **切換機制**：Admin UI 提供切換器，切換後 Editor Canvas 載入該 Locale 的 `title` 與 `body`。
* **發佈邏輯**：可設定「全語系發佈」或「僅發佈特定語系」。

### 3.3 SEO 與 社交分享

* **自定義 Slug**：全站唯一，作為 URL 關鍵字。
* **Meta 預覽**：在後台即時顯示 Google 搜尋結果與 FB/Twitter 分享卡片的預覽樣式。

### 3.4 媒體庫與資源管理 (Asset Library)

* **獨立介面**：提供 `/admin/assets` 頁面，網格狀展示所有上傳的圖片與文件。
* **分類與搜尋**：支援依照「圖片/文件」過濾，並可搜尋檔名。
* **整合體驗**：
    * 編輯器中點擊「更换圖片」可開啟媒體庫模態框 (Modal) 選擇現有資源。
    * 支援直接拖曳上傳至媒體庫。
* **容量提示**：顯示當前佔用的 R3c 存儲空間。

---

## 4. UI/UX 規範 (Interface Design)

### 4.1 編輯器配置 (Layout)

| 區域 | 說明 |
| --- | --- |
| **Top Bar** | 顯示儲存狀態（Saved/Saving）、語系切換、Preview 按鈕、Publish 按鈕。 |
| **Main (Center)** | 寬度 800px 居中。頂部為 H1 Title，下方為 Tiptap Block Area。 |
| **Right Sidebar** | **[SEO 標籤頁]**：Slug, Meta Title/Desc, OG Image。<br>

<br>**[設定標籤頁]**：作者、發佈日期、分類標籤。 |

### 4.2 互動細節 (Interactions)

* **Drag & Drop**：拖動時，目標位置顯示水平藍線 (Indicator)。
* **Slash Command**：輸入 `/` 彈出快速插入選單（Heading, Image, List）。

---

## 5. 系統架構與 API (Technical Spec)

### 5.1 資料庫 Schema 調整

在 `post_contents` 中，`body` 欄位應存儲符合 Tiptap/ProseMirror 規範的 JSON。

### 5.2 核心 API

* `POST /v1/cms/assets/upload`：處理圖片拖入後的異步上傳。
* `GET /v1/public/cms/posts/:slug?locale=...`：
* 需包含 `next_post` 與 `prev_post` 的基本資訊以利 SEO 鏈接。
* 回傳包含全套 Meta Tags 的 JSON 或預渲染 HTML。



---

## 6. 驗收標準 (Acceptance Criteria)

* [ ] **拖拽性能**：拖拽 Block 時 FPS 穩定在 60，無明顯延遲。
* [ ] **SEO 分數**：Lighthouse SEO 項目達 95+ 分。
* [ ] **安全性**：只有具備 `cms.post.update` 權限的人員可觸發自動儲存。
* [ ] **兼容性**：產出的內容在行動端瀏覽器需正確自動斷行與縮放圖片。

---

## 7. 下一步建議

這份規格書已經將「Notion 式編輯」與「多語系 CMS」深度結合。**為了讓你更順利地進入開發階段，我可以幫你：**

1. **繪製編輯器的 Block 拖拽組件邏輯圖**（說明 `dnd-kit` 如何與 `Tiptap` 溝通）。
2. **設計 `file_objects` 的上傳狀態機**（從 Pending -> Uploading -> Success 的 UI 變化）。
3. **提供一個符合 SEO 規範的 SSR 頁面 HTML 結構範本**。

你想先從哪一個部分的實作細節開始？

---

## 4. Acceptance Criteria

- [ ] **Data Integrity**: Post Cannot be published without a validated Slug and Title.
- [ ] **Safety**: Unauthorized users cannot access Admin CMS APIs.
- [ ] **Performance**: Public API response time < 100ms for cached hits (or basic DB fetch).
- [ ] **SEO**: Google Lighthouse SEO score > 90 for blog pages.
