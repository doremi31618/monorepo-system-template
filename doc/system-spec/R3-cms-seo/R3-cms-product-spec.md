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

---

## 8. Incremental Product Spec (2026-02-18)

### 8.1 CMS / Asset 查詢能力
- CMS 列表需支援：
  - 名稱查詢：可用文章標題或 slug 查詢。
  - 狀態篩選：`draft` / `published` / `archived`。
  - 標籤篩選：依 tag 過濾文章。
- Asset 列表需支援：
  - 名稱查詢：檔名（`original_name`）與 `storage_key`。
  - 狀態篩選：`ready` / `pending`。

### 8.2 CMS 插圖流程（Modal）
- 在 CMS 新增圖片時，需開啟同一個 Asset Picker Modal。
- Modal 需同時支援：
  - 上傳新圖片（成功後可直接選用）。
  - 選擇既有圖片（以縮圖方式列表）。
- 本規格同時套用於：
  - 文章封面圖（Cover Image）。
  - 編輯器內文插圖（Slash menu image）。

### 8.3 Tag 功能
- 文章需可綁定多個 tag。
- 編輯頁需提供可選取的 tag 列表（tag list）。
- 可在編輯頁直接新增 tag，並立即可被選取。

### 8.4 Acceptance Criteria（Incremental）
- [ ] CMS 列表可依名稱與狀態查詢，且結果正確。
- [ ] Asset 列表可依名稱與狀態查詢，且結果正確。
- [ ] CMS 選圖 Modal 可從「上傳新圖」與「既有資產」兩種路徑完成插圖。
- [ ] 文章可儲存並讀回 tag；編輯頁可顯示 tag 列表與已選 tag。

## 9. Incremental Product Spec (2026-02-18-B)

### 9.1 CMS Post 搜尋（加強）
- CMS 文章列表需同時支援下列查詢條件，且可組合使用：
  - 關鍵字：標題與 slug。
  - 狀態：`draft` / `published` / `archived`。
  - 日期：更新日期區間（起訖日）。
  - Tag：依指定 tag 過濾文章。
- 管理端 UI 需提供「搜尋」與「重置」操作。

### 9.2 CMS Tags 後台維護（CRUD）
- CMS 需提供 Tag 列表管理區，支援：
  - 新增 tag。
  - 查詢 tag（名稱/slug）。
  - 編輯 tag 名稱（slug 自動維持唯一）。
  - 刪除 tag。
- Tag 刪除後，文章上的 tag 關聯應同步清除，不可殘留無效關聯。

### 9.3 CMS Link Preview
- CMS 編輯頁需支援輸入外部 URL，並產生 Link Preview 卡片。
- Link Preview 至少包含：
  - 圖片預覽（image）。
  - 標題（title）。
  - 描述（description）。
- 預覽資料需可儲存並在重新載入編輯頁後維持顯示。

### 9.4 Acceptance Criteria（Incremental B）
- [ ] CMS 搜尋可依關鍵字、狀態、日期、tag 條件單獨或組合查詢。
- [ ] Tag 管理區可完成增刪查改，且資料行為符合預期。
- [ ] Link Preview 可成功抓取並顯示 image/title/description。
- [ ] Link Preview 資料可儲存，重新進入文章編輯頁後仍存在。

## 10. Incremental Product Spec (2026-02-18-C)

### 10.1 CMS 列表分區（Tab）
- CMS 後台列表需改為 Tab 分區呈現：
  - `Post List`：文章搜尋與文章列表。
  - `Tag List`：tag 查詢與 tag CRUD 管理。
- 預設進入 `Post List`，切換 tab 不應重置既有輸入條件。

### 10.2 Asset 可編輯欄位
- Asset 管理頁每個資產需可編輯：
  - 檔案名稱（`original_name`）。
  - 狀態（`pending` / `ready`）。
- 使用者需可在同頁完成編輯、儲存與取消，不需離開頁面。

### 10.3 Post Editor Slug 可編輯
- CMS 文章編輯頁中的 `slug` 欄位改為可編輯。
- `slug` 變更需可被儲存，且保存後可立即反映到文章資料。

### 10.4 Acceptance Criteria（Incremental C）
- [ ] CMS 列表可透過 tab 在 Post 與 Tag 管理之間切換。
- [ ] Asset 可編輯名稱與狀態，儲存後列表立即更新。
- [ ] Post editor 的 slug 可編輯且可成功保存。

## 11. Incremental Product Spec (2026-02-18-D)

### 11.1 Link Preview 互動修正
- Link Preview 不再由右側設定欄手動輸入與生成。
- 使用者在 **Post Editor 內輸入或貼上連結** 時，需自動轉換為 Link Preview 卡片。
- Link Preview 卡片需顯示：
  - 預覽圖片
  - 標題
  - 描述
  - 網址

### 11.2 Link Preview 元件可更換網址
- 每個 Link Preview 卡片需提供「更換網址」能力。
- 更換網址後，卡片需自動重新抓取並更新圖片、標題、描述。

### 11.3 Acceptance Criteria（Incremental D）
- [ ] 在 editor 貼上/輸入 URL 後可自動轉換成 Link Preview 卡片。
- [ ] Link Preview 卡片可更換網址並重新抓取 metadata。
- [ ] 文章重新載入後，Link Preview 卡片仍可正確顯示。

## 12. Incremental Product Spec (2026-02-18-E)

### 12.1 Link Preview 三段尺寸
- CMS Post Editor 中每張 Link Preview 卡片需可切換三種尺寸：
  - `small`
  - `medium`（預設）
  - `large`
- 尺寸設定屬於該卡片內容的一部分，儲存文章後需保留。

### 12.2 編輯與預覽行為
- 尺寸切換需在卡片內可直接操作，不需透過右側設定欄。
- 在唯讀情境（例如 public preview）不顯示尺寸切換控制。
- 唯讀情境仍需依已儲存尺寸渲染卡片外觀。

### 12.3 Acceptance Criteria（Incremental E）
- [ ] Editor 內每張 Link Preview 卡片可切換 `S/M/L` 尺寸。
- [ ] 儲存後重新打開文章，Link Preview 尺寸仍正確。
- [ ] Public preview 會依儲存尺寸顯示，且不顯示尺寸控制按鈕。

## 13. Incremental Product Spec (2026-02-18-F)

### 13.1 Post Editor：Table of Contents 元件
- Post Editor 需新增可插入的 `Table of Contents` 區塊元件。
- 當文章包含 TOC 區塊時，編輯區右側需出現「可隱藏目錄」：
  - 預設收合。
  - 滑鼠移入時展開。
  - 顯示目前文章 heading 階層（H1/H2/H3）。

### 13.2 Public Blog 頁面（非後台）
- 新增真正前台可瀏覽頁面：
  - 文章列表頁（`/blog`）
  - 單篇文章頁（`/blog/:slug`）
- 單篇文章頁需以 slug 載入已發佈文章，並顯示封面、標題、內文、標籤與日期。

### 13.3 點閱率統計
- 系統需統計：
  - 文章點閱率（post view count）。
  - tag 總點閱率（tag 底下所有文章點閱總和）。
- CMS 後台列表需可顯示 post 點閱數與 tag 總點閱數。

### 13.4 首頁內容更新
- 首頁需新增：
  - `最新文章` component（Latest Posts）。
  - `熱門文章 tag` component（以 tag 總點閱排序，顯示該 tag 下熱門文章）。

### 13.5 Acceptance Criteria（Incremental F）
- [ ] Editor 可插入 TOC block，且右側目錄可收合/滑入展開。
- [ ] `/blog` 可列出已發佈文章，`/blog/:slug` 可正確顯示單篇文章。
- [ ] 單篇文章瀏覽可累計點閱，後台可看到 post 與 tag 的點閱統計。
- [ ] 首頁可顯示最新文章與熱門 tag 文章區塊。

## 14. Incremental Product Spec (2026-02-18-G)

### 14.1 後台 Dashboard 統計
- 後台 Dashboard 需新增三個區塊：
  - 每日點擊數量（Daily Clicks）。
  - 最受歡迎前五篇文章（Top 5 Posts by views）。
  - 最受歡迎前五個 Tag（Top 5 Tags by aggregated views）。
- Dashboard 支援視窗天數切換（例如 7/14/30 天）與語系選擇（用於文章標題顯示）。

### 14.2 TOC 顯示規則修正
- `Table of Contents` 元件本體必須顯示目錄內容（H1/H2/H3 清單）。
- 右側 hover 目錄保留，不移除。
- 最終行為為「兩處同時顯示目錄」：
  - 編輯器右側可收合目錄。
  - 文章內 TOC 元件本體目錄。

### 14.3 Preview 編輯控制修正
- 文章 preview（唯讀模式）不得顯示 bubble editor / inline formatting menu。
- Preview 僅保留內容瀏覽能力，不提供編輯工具列。

### 14.4 前台圖片穩定性修正
- 前台與 preview 圖片不得依賴短效簽名 URL（會過期）。
- 系統需改用可長期使用的穩定圖片路徑機制。
- 舊資料中既有簽名 URL 需可被相容轉換，避免既有文章圖片失效。

### 14.5 Acceptance Criteria（Incremental G）
- [ ] Dashboard 顯示每日點擊、Top 5 熱門文章、Top 5 熱門 Tag。
- [ ] TOC 元件本體可顯示目錄，且右側目錄仍可正常運作。
- [ ] Preview 模式選取文字時不再出現 bubble editor。
- [ ] 前台 `/blog`、文章頁、preview 的圖片可穩定顯示，且不因簽名 URL 過期而失效。
