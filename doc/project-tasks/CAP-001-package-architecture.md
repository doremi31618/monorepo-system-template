# Package 架構與相依性治理 Project Task

> **Work Item ID**: CAP-001
> **Status**: Review
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/CAP-001-package-architecture`
> **Base**: `origin/dev` (`14c3b06`)
> **Worktree**: `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/CAP-001-package-architecture`
> **PR**: Owner-authorized direct integration to `dev` and `main` (no PR)
> **Related Spec**: `doc/system-spec/architecture/capability-platform.md`
> **Release**: pending
> **Last updated**: 2026-09-02

## Objective

讓 repository 明確呈現 NestJS-first、SvelteKit-first 的產品定位，並使 package 的 framework、runtime、擁有的大模組、使用方式與允許相依方向都能從名稱、目錄、README 與自動檢查辨識。

## Discovery / Shared Understanding

- **Mode**: Grill Me enabled，限制 10 題
- **Gate status**: Approved
- **Approved at**: 2026-08-31
- **Summary**: 將現有靜態組裝模組定位為 capability packages；依 framework／大模組／子模組重組實體目錄與 package 名稱；DTO 與 `class-validator` 回到所屬 Nest capability；以 framework-neutral types packages 統一跨 package 與跨 runtime 型別；補齊中文文件與可執行的 dependency health。
- **Key decisions**:
  - 不宣稱或實作自動發現、enable/disable 的 plugin system。
  - Package 與目錄採 `nest/identity/*`、`nest/content/*`、`nest/infra/*`、`types/*`、`browser/*`、`svelte/*`、`testing/*` 分層。
  - 不保留舊 package alias，所有引用原子更新。
  - 文件統一使用繁體中文，程式識別字與 package metadata 使用英文。
  - OpenAPI code generation 不納入本 Work Item；規格保留未來漸進遷移路徑。
- **Assumptions**: 此 repository 的 packages 皆為 private workspace，沒有 repository 外部 consumer 需要舊名稱相容性。
- **Risks and mitigations**:
  - 大量 rename 可能遺漏引用：以全 repository 搜尋、dependency rules、完整 build/test 驗證。
  - 型別搬移可能揭露既有前後端 shape 差異：保持 runtime response 不變，只統一 interface 與 call sites。
  - OpenAPI schema 仍非 HTTP interface 的唯一真相：明確記錄為後續 Work Item，不宣稱 generated typed client 已完成。
- **Architecture follow-up (2026-09-02)**:
  - Grill Me 由 Owner 明確要求跳過；Gate status 為 `Bypassed by explicit instruction`。
  - Migration config 與 history 搬回 `apps/api/db`，因目前只服務單一 API 與 PostgreSQL／Supabase，獨立 `apps/migrator` 沒有足夠 leverage。
  - 假設 migration 仍由部署流程以一次性指令執行，不加入 API bootstrap；若未來有多個 deployable process 共用 schema，再重新評估獨立 migrator Module。
- **Resizable Sidebar follow-up (2026-09-02)**:
  - Grill Me enabled，限制 5 題；第 5 題共同理解由 Owner 核准，Gate status 為 `Approved`。
  - 共用 `@platform/svelte-ui/sidebar` 擁有桌面寬度、拖曳、收合與持久化行為，Admin layout 改為使用共用元件。
  - 桌面預設 `256px`、限制 `240–480px`；收合時側欄內容與占位歸零，只在主內容左上角保留一個展開按鈕，再展開恢復上次寬度。
  - 手機維持 Sheet 抽屜，不套用桌面寬度；保留 `Cmd/Ctrl + B`，resize handle 支援方向鍵與 ARIA separator 語意。
- **Config ownership follow-up (2026-09-02)**:
  - Owner 核准共同理解與建議 seam，Gate status 為 `Approved`。
  - 完整 API env schema、process config 與產品 bootstrap policy 由 `apps/api` composition root 擁有，不包裝成共用 package。
  - Access Control package 只接受窄型別 bootstrap config；Logger 與 Scheduling 各自擁有自己的設定切片，不依賴 app-wide config。
  - 移除 `@platform/nest-infra-config`，且 Root Admin credentials 不再硬編碼於 package。
- **Admin Data View Toolbar follow-up (2026-09-02)**:
  - Grill Me enabled；第 6 題共同理解由 Owner 核准，Gate status 為 `Approved`。
  - Users、Roles、CMS Posts、Assets 採 Notion-like Search／Filter／ordered multi-sort，但沿用專案 tokens 與 Lucide，不複製品牌外觀。
  - `@platform/svelte-ui` 擁有通用 toolbar、rule editor、query types 與 codec；app 擁有領域欄位、URL navigation 與 API integration。
  - Filter 第一版為 `AND`，不做 nested `OR`、Saved Views、view tabs 或 display settings。
  - Owner 明確選擇直接納入 CAP-001；接受 review scope 擴大，以獨立文件段落與測試證據維持可審核性。
- **Admin theme and Article Settings follow-up (2026-09-02)**:
  - 暗色主題修正依 TDD 處理 Dashboard 與 CMS editor 的固定淺色 surface；語意色改由 Web theme tokens 統一驅動。
  - Article Settings collapse 啟用 Grill Me，限制 5 題；第 3 題共同理解由 Owner 核准，Gate status 為 `Approved`。
  - 桌面 Article Settings 預設展開且不保存狀態；收合後右欄零占位，editor 擴展，只在標題工具列右上角留下 Settings 圖示。
  - 展開時收合按鈕位於 Settings 標題旁；手機保留既有 Sheet drawer，不新增 resize 或 preference persistence。
  - CMS editor 沒有 TOC 時使用置中、全可用寬度的內容面；只有內容實際包含 TOC node 時才預留右側欄，並保留響應式 padding／margin。
  - Owner 明確要求依已完成的診斷直接修復 editor interaction，因此本次不重複 Grill Me；所有 Tiptap packages 固定為 `3.30.5`，ProseMirror model 在 lockfile 與 Vite runtime 皆維持單一 instance。
  - 一般 Enter、擴大 block toolbar hover hit area、空白畫布點擊新增 paragraph，以及桌面 Settings overflow scrolling 納入同一組真實 Chromium regression。

## Acceptance Criteria

- [x] 根 README 明確宣告 NestJS-first、SvelteKit-first 與 framework-neutral 邊界。
- [x] Package 實體目錄、名稱、imports、workspace dependencies、TypeScript references、build order 與 Drizzle glob 完成重組。
- [x] DTO／`class-validator` 位於所屬 Nest capability；types packages 不依賴 framework、ORM 或 decorator runtime。
- [x] API response／error envelope、Browser SDK 與 Web 使用同一份 framework-neutral 型別。
- [x] 每個重構後 package 都有中文 README、framework/runtime metadata、使用方式與相依規則。
- [x] Onboarding 說明 capability 的建立、加入、設定、schema/migration、移除與 dependency constraints。
- [x] `deps:graph` 可從實際 imports 產生 Mermaid graph。
- [x] `deps:check` 阻擋循環、無法解析、未宣告、跨 framework、`packages -> apps` 與違反大模組方向的相依。
- [x] `deps:report` 報告 unused files/exports，第一版不阻擋 CI。
- [x] `deps:audit` 在 high／critical vulnerability 時失敗；唯一暫時例外有明確編號、範圍與移除條件。
- [x] 目前程式、設定、onboarding 與架構文件不存在舊 package 名稱或舊 workspace 路徑。
- [x] Lint、typecheck、unit tests、dependency checks、audit、build 與 frozen lockfile 安裝通過；既有全 repository format baseline 已記錄。
- [x] Migration config/history 位於 `apps/api/db`，根指令仍可 generate、migrate 與啟動 Studio，且 API bootstrap 不自動執行 migration。
- [x] 隔離 PostgreSQL migration、完整測試／建置與 production API 啟動驗證通過。
- [x] Storybook 載入 Web 的 Tailwind theme，並以 UI Library catalog 展示 21 組公開 Svelte 元件。
- [x] 共用 Sidebar 可在桌面拖曳至 `240–480px`、保存寬度；收合時零占位且只保留單一展開按鈕。
- [x] Admin layout 使用共用 Sidebar，手機維持 Sheet 行為，Storybook 展示並驗證調寬與收合流程。
- [x] API env／process config 與 Access Control bootstrap policy 位於 `apps/api`，packages 不擁有完整 application config。
- [x] `@platform/nest-infra-config` 已移除；Access Control、Logger、Scheduling 只依賴各自的窄設定介面。
- [x] Root Admin credentials 由 API env 提供，package 不含硬編碼帳密。
- [x] 共用 Data View Toolbar 支援 Search、typed Filter rules、ordered multi-sort、active summaries、desktop Popover 與 mobile Sheet。
- [x] Users、Roles、CMS Posts、Assets 使用同一個 package toolbar，query state 可由 URL 還原且 query change 重設分頁。
- [x] Admin list API 以白名單驗證 filter/sort，並在 pagination 前執行 ordered multi-sort 與穩定 tie-breaker。
- [x] Data View Toolbar keyboard／ARIA／focus、Storybook、Web、API unit/E2E 與 regression 驗證通過。
- [x] Dashboard 與 CMS editor 的 surfaces、文字、表單與 editor chrome 使用語意化 theme tokens，明暗切換回歸測試通過。
- [x] 桌面 Article Settings 可完整收合／展開；收合後 editor 變寬且只保留單一 Settings 圖示，手機 Sheet 行為不變。
- [x] CMS editor 無 TOC 時置中並使用全可用寬度；有 TOC 時才保留右側欄，且兩種狀態皆保留響應式 padding／margin。
- [x] Tiptap 固定於 `3.30.5` 且 ProseMirror runtime 去重；一般 Enter 可建立新段落，不再產生跨 instance Fragment error。
- [x] CMS editor 的桌面 block toolbar 可由擴大後的 gutter／row hit area 觸發，空白畫布點擊可在對應位置建立並聚焦 paragraph。
- [x] 桌面 Article Settings 內容超出 viewport 時可使用滑鼠滾輪捲至底部，不再被固定高度容器裁切。

## Scope

### In scope

- Package 目錄與 workspace name 重構。
- Framework-neutral shared／identity／content types。
- Module-owned Nest request/response DTO 與 validation。
- Root/package README、onboarding、架構規格與 dependency health 文件。
- Dependency graph、architecture rules、manifest analysis、audit 與 CI。
- Migration authority 從獨立 app 搬回 API composition root，保留獨立部署執行時機。
- 共用 Svelte Sidebar 的桌面 resize／collapse 行為與 Admin consumer migration。
- API config ownership 搬回 composition root，並將 package consumer 改為窄設定 seam。
- 共用 Svelte Data View Toolbar、四個 Admin collection consumer 與必要的 server query contract。
- Admin Dashboard／CMS editor 主題一致性與桌面 Article Settings 收合互動。
- CMS editor 鍵盤、block hover、空白畫布點擊與 workspace／Settings overflow scrolling。
- 所有內部 consumer、測試、設定與 lockfile 遷移。

### Out of scope

- 可自動發現、安裝、enable/disable 的 plugin runtime。
- OpenAPI 產生 TypeScript client、dev watcher 與 schema drift CI。
- 對外 npm 發布與舊 package name compatibility layer。
- 改變既有 HTTP endpoint、database schema 或 runtime response shape。
- Saved Views、view tabs、欄位顯示設定、nested `OR` 與 collection 外的局部搜尋。
- Article Settings 拖曳調寬、收合狀態持久化與手機 Sheet 行為改版。

## Required Tests

- [x] Unit：既有 capability 與 Browser SDK tests。
- [x] Architecture：TypeScript AST dependency rules、graph freshness 與禁止舊名稱檢查。
- [x] Manifest：同一 dependency checker 驗證未宣告／無法解析的 imports；Knip 報告 unused files/exports。
- [x] Security：Bun audit high／critical。
- [x] Integration：API schema composition、Web/Storybook workspace resolution。
- [x] Storybook：29 個 component tests、static build 與瀏覽器互動 smoke test。
- [x] Sidebar：寬度上下限、保存／恢復、收合零占位、單一展開按鈕與鍵盤 resize。
- [x] Config ownership：API env validation、Access Control injected bootstrap、Logger／Scheduling config tests 與無 config package dependency。
- [x] Lint／typecheck／build：repository 定義的完整命令。
- [x] Data View query codec：有效 round-trip、invalid query repair、ordered sort 與 incomplete draft exclusion。
- [x] API：Users／Roles／CMS／Assets filter、ordered multi-sort、pagination ordering 與 invalid query validation。
- [x] UI：Search debounce／Enter／Escape、rule add/remove、sort reorder、active counts、Popover／Sheet 與 focus restoration。
- [ ] Consumer regression：四個 Admin collection 的 URL restore、page reset、loading／empty／error state。
- [x] Admin theme：Dashboard／CMS editor 暗色 surfaces、文字可讀性與 light/dark toggle browser regression。
- [x] Article Settings：預設展開、完整收合、editor 寬度成長、單一重開按鈕、鍵盤／ARIA 與 mobile regression。
- [x] Editor interaction：Enter paragraph split、單一 ProseMirror runtime、擴大 hover hit area、canvas click paragraph insertion 與 Settings wheel scrolling regression。

## Tasks

- [x] Discovery 與共同理解核准
- [x] 建立隔離 branch／worktree
- [x] Project Task
- [x] Technical Spec
- [x] Package implementation
- [x] Types 與 consumer migration
- [x] README 與 onboarding
- [x] Dependency health 與 CI
- [x] Validation
- [x] Move migration authority into API composition root
- [x] Re-run migration, regression, build and startup validation
- [x] Configure Storybook UI Library catalog and shared Web theme
- [x] Implement and verify resizable shared Sidebar
- [x] Migrate Admin layout to shared Sidebar
- [x] Move API config ownership back to composition root
- [x] Inject Access Control bootstrap config and remove hardcoded Root Admin credentials
- [x] Give Logger and Scheduling package-owned narrow config slices
- [x] Remove `@platform/nest-infra-config` and refresh dependency graph
- [x] Approve Admin Data View Toolbar shared understanding
- [x] Document Data View Toolbar product／technical／interaction spec
- [x] Implement query codec and reusable Svelte UI package components with TDD
- [x] Extend Admin list API filter and ordered multi-sort contracts
- [x] Migrate Users、Roles、CMS Posts and Assets consumers
- [x] Add Storybook interactions and full regression validation
- [x] Replace Dashboard and CMS editor hard-coded light colors with semantic theme tokens
- [x] Implement desktop Article Settings collapse with TDD
- [ ] Independent review
- [ ] Dev integration
- [ ] Release note

## Decisions and Work Log

- 2026-08-31：共同理解於第 10 題核准；Work Item ID 指派為 CAP-001。
- 2026-08-31：從 `origin/dev` 建立隔離 worktree，不碰觸原工作目錄既有 `.DS_Store` 修改。
- 2026-08-31：完成 16 個 capability package 的實體分層、重新命名、imports 與 build references 原子遷移。
- 2026-08-31：將跨 runtime 型別拆為 `types-shared`、`types-identity`、`types-content`，Nest DTO 與 `class-validator` 回到擁有模組。
- 2026-08-31：新增實際 import graph、架構邊界、README/metadata、manifest 與 cycle 檢查，接入 CI。
- 2026-08-31：升級有高風險公告的 dependencies；`GHSA-r5fr-rjxr-66jc` 因尚無可安裝修正版，以限縮例外追蹤。
- 2026-08-31：升級 Svelte/Tailwind Prettier plugins，修復 Prettier 3.7+ 的 formatter crash；舊檔格式基線留待獨立清理。
- 2026-09-02：Owner 明確跳過追加需求的 Grill Me；決定移除淺層 `apps/migrator` workspace，將唯一 migration history 搬回 `apps/api/db`，但不改成 API 啟動時自動 migration。
- 2026-09-02：Storybook 接入 Tailwind Vite plugin 與 Web theme，新增 21 組公開 Svelte UI 元件 catalog；component tests 29/29、static build 與 Dropdown Menu 瀏覽器互動驗證通過。
- 2026-09-02：Owner 於 5 題 Grill Me 核准 resizable Sidebar 行為；採共享元件持有規則、Admin 消費、桌面寬度持久化、完整收合與手機 Sheet 不變。
- 2026-09-02：以 TDD 完成 Sidebar；Storybook 先驗證缺少 separator、收合內容仍可見與拖曳寬度未更新三個 RED，再完成鍵盤／pointer resize、localStorage 恢復與完整收合。UI、Web 與 Storybook checks/build/tests 通過，並以隔離 PostgreSQL、production API 及實際 Admin 登入驗證 256→336px 拖曳、單一展開按鈕與重新開頁恢復 336px。
- 2026-09-02：新增共用 Svelte UI 元件 onboarding 手冊，記錄 shadcn-svelte／手動建立流程、package exports、Storybook、Tailwind theme、watch 開發、驗證清單與常見排錯，並由 Root README 與 Frontend Onboarding 提供入口。
- 2026-09-02：補強 `apps/web/.env.example` 為可複製的公開 Web env contract，標示 `/v1` prefix、禁止 secrets 與 Vite 重啟要求，並同步 Root／Web README 與 Frontend Onboarding。
- 2026-09-02：以 TDD 將完整 API env schema 與 Access Control bootstrap policy 搬回 `apps/api/src/config`；Access Control 改由 `registerAsync()` 接收窄設定，Logger／Scheduling 各自擁有 package-local config slice，並移除 `@platform/nest-infra-config` workspace。
- 2026-09-02：Root Admin 帳密改由 API env 注入；e2e 與 Web 移除 `admin@system.com/admin123` 假設。隔離 PostgreSQL migration、14/14 e2e、production API health check 與環境注入 Root Admin 登入皆通過。
- 2026-09-02：修正 API env drift；實際 `.env`、`.env.example` 與 app-owned Zod schema 已有相同 key set，移除未被 runtime 使用的 JWT／Bcrypt／protocol／host 欄位，補齊 callback base URL、Worker、Google、Storage 與 Root Admin，並新增 contract parity regression test。
- 2026-09-02：Owner 核准 Notion-like Admin Data View Toolbar；範圍涵蓋四個頂層 collection、共用 Svelte UI package、URL-backed query、AND filters 與 ordered multi-sort，並明確選擇納入 CAP-001 工作樹。
- 2026-09-02：以真實 Chromium regression 先重現 Dashboard／CMS editor 暗色 surface 仍為白色，再將頁面、editor typography、link preview、TOC 與浮動選單改用 theme tokens；dark／light toggle、Web check 與 production build 通過。
- 2026-09-02：Owner 於第 3 題 Grill Me 核准 Article Settings 收合規格；預設展開、不保存狀態、桌面零占位收合與單一圖示重開，手機 Sheet 不變。
- 2026-09-02：Article Settings browser test 先以缺少 accessible collapse control 進入 RED，再完成 grid column transition、零占位收合、單一 toolbar 圖示、Enter 鍵、ARIA state、reload default 與 mobile Sheet regression；Web lint／check／build 與 `git diff --check` 通過。
- 2026-09-02：Editor interaction 依 TDD 分四個 vertical slices 完成：一般 Enter 先重現多份 `prosemirror-model` Fragment error，再以 Tiptap exact pin、root override 與 Vite dedupe 修復；gutter hover、blank canvas paragraph insertion、Settings overflow scrolling 各自先 RED 再 GREEN。
- 2026-09-02：以 TDD 完成共用 Data View Toolbar、URL query codec 與四個 Admin collection consumer；Search、AND filters、ordered multi-sort、active counts、desktop Popover／mobile Sheet 均由 `@platform/svelte-ui` 提供，API 以欄位白名單與穩定 tie-breaker 在分頁前查詢。
- 2026-09-02：CMS／Assets list 補齊暗色語意色；CMS editor 的置中回歸先重現 Settings 收合後向左偏移 96px，再改為無 TOC 時置中 `max-w-6xl` 全寬內容面、有 TOC 時才限制內容並預留右欄。Web browser regression、Storybook 32/32 與 API e2e 16/16 通過。

## Handoff

- **Commit/PR**: pending
- **Branch/Worktree**: `feat/CAP-001-package-architecture`；`/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/CAP-001-package-architecture`
- **Validation**: `bun run check`、`bun run test`、`bun run build`、`bun run lint`、`bun run deps:audit`、`bun install --frozen-lockfile`、API e2e 16/16、隔離 PostgreSQL migration、production API health/login、Storybook 32 個 component tests、Storybook static build、Admin dark/editor layout 瀏覽器回歸與 `git diff --check` 通過。
- **Known issues**:
  - OpenAPI runtime schema 與 TypeScript interface 的完全同步不在本 Work Item 內。
  - Web 維持既有 16 個 `svelte-check` warnings 與 22 個 ESLint warnings，皆為 0 errors。
  - `deps:report` 回報 28 個 unused files 與 3 組 unused exports，依決策僅報告、不阻擋。
  - Repository 全域 `format:check` 有大量既存未格式化檔；formatter crash 已修復，但本 Work Item 不製造全檔案格式化 diff。
  - `GHSA-r5fr-rjxr-66jc` 暫時例外詳見 `doc/system-spec/architecture/security-audit-exceptions.md`。
- **Next action**: 獨立 review 通過後再進行 dev integration；OpenAPI typed client 另開 Work Item。
