# Admin Panel 設計規範 (Design System Specification)

| 屬性          | 內容                              |
| :------------ | :-------------------------------- |
| **基礎框架**  | shadcn/ui                         |
| **CSS 框架**  | Tailwind CSS                      |
| **圖標庫**    | Lucide React                      |
| **版本**      | v1.0                              |
| **適用對象**  | Frontend Developers, UI Designers |
| **Work Item** | CAP-001                           |

## 1. 設計哲學 (Design Philosophy)

本專案採用 `shadcn/ui` 作為設計系統基礎。與傳統組件庫不同，shadcn/ui 不是一個 NPM 依賴包，而是一套可複製、可客製化的 **Headless Component** 集合。

- **Accessibility (無障礙)**: 所有互動組件皆基於 Radix UI，確保鍵盤導航與螢幕閱讀器支援。
- **Token-based**: 使用 CSS Variables 定義語意化顏色（Semantic Colors），支援一鍵切換深色模式 (Dark Mode)。
- **Tailwind Native**: 樣式完全由 Tailwind Utility Classes 控制，易於維護與覆寫。

## 2. 色彩系統 (Color System)

我們使用語意化命名 (Semantic Naming) 來定義顏色，而非直接鎖定色碼。這使得主題切換（Light/Dark）變得容易。

### 2.1 基礎色票 (Base Palette)

本專案的色調配置如下：

| Token                  | Tailwind Class            | Light Mode (Hex)       | 用途                         |
| :--------------------- | :------------------------ | :--------------------- | :--------------------------- |
| **Primary**            | `bg-primary`              | `#4F46E5` (Indigo-600) | 主要按鈕、選中狀態、強調文字 |
| **Primary Foreground** | `text-primary-foreground` | `#FFFFFF`              | Primary 背景上的文字         |
| **Secondary**          | `bg-secondary`            | `#F1F5F9` (Slate-100)  | 次要按鈕、標籤背景 (Badge)   |
| **Destructive**        | `bg-destructive`          | `#EF4444` (Red-500)    | 刪除、危險操作、錯誤提示     |
| **Background**         | `bg-background`           | `#FFFFFF` (White)      | 頁面背景、卡片背景           |
| **Muted**              | `bg-muted`                | `#F8FAFC` (Slate-50)   | 頁面底色、禁用狀態           |
| **Border**             | `border-border`           | `#E2E8F0` (Slate-200)  | 邊框、分隔線                 |
| **Ring**               | `ring-ring`               | `#4F46E5` (Indigo-600) | Focus 狀態的光暈             |

### 2.2 狀態色 (Status Colors)

用於 Badge 或 Alert：

- **Active / Success**: `text-emerald-700` / `bg-emerald-100`
- **Inactive / Neutral**: `text-slate-700` / `bg-slate-100`
- **Warning / System**: `text-amber-700` / `bg-amber-100`

## 3. 字型與排版 (Typography)

- **Font Family**:
  - 英文: `Inter`, `system-ui`, `sans-serif`
  - 中文: `Noto Sans TC`, `Microsoft JhengHei`
- **Scale**:
  - **H1** (Page Title): `text-xl font-semibold`
  - **H2** (Section Title): `text-lg font-bold`
  - **H3** (Card Title): `text-base font-semibold`
  - **Body**: `text-sm` (後台系統標準字級)
  - **Small / Caption**: `text-xs text-muted-foreground`

## 4. 核心組件規範 (Component Specifications)

所有組件應優先使用 `npx shadcn-ui@latest add <component>` 安裝，並根據以下規範進行客製。

### 4.1 按鈕 (Button)

- **Base Style**: `h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors`
- **Variants**:
  - `default`: 用於主要操作（如：新增使用者、儲存）。
  - `outline`: 用於次要操作（如：取消、匯出、搜尋）。
  - `ghost`: 用於表格內操作（如：...選單）、導覽列按鈕。
  - `destructive`: 用於刪除確認。

### 4.2 卡片 (Card)

- **Style**: `rounded-xl border bg-card text-card-foreground shadow-sm`
- **Usage**: 用於包覆表格、表單或數據概覽。
- **Interaction**: 可點擊的卡片（如角色列表）應加上 `hover:border-primary/50` 與 `cursor-pointer`。

### 4.3 表格 (Table)

- **Layout**:
  - **Header**: `bg-muted/50 text-muted-foreground font-medium`
  - **Row**: `hover:bg-muted/50 data-[state=selected]:bg-muted`
- **Pagination**: 置於表格卡片底部，包含頁碼與上一頁/下一頁按鈕。

### 4.4 彈窗 (Dialog / Modal)

- **Overlay**: `bg-black/50 backdrop-blur-sm`
- **Content**: `max-w-md` (預設) 或 `max-w-2xl` (複雜表單)。
- **Animation**: `animate-in fade-in zoom-in-95`。

### 4.5 輸入框 (Input)

- **Style**: `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

### 4.6 側邊欄 (Sidebar)

- Web 應使用 `@platform/svelte-ui/sidebar`，不在 route layout 重複維護另一套 Sidebar state 與樣式。
- 桌面展開寬度預設為 `256px`，使用者可拖曳至 `240–480px`；寬度保存在瀏覽器，收合再展開時恢復上次值。
- 桌面收合時 Sidebar 內容、背景與 layout gap 必須全部隱藏，主內容擴展至全寬，只在左上角保留一個具 accessible name 的展開按鈕。
- Resize handle 使用 `separator` 語意，公開目前值與上下限，並支援方向鍵、Home 與 End 鍵。
- `Cmd/Ctrl + B` 維持展開／收合快捷鍵。
- `md` 以下維持 Sheet 抽屜，不顯示 resize handle，也不受桌面保存寬度影響。

### 4.7 資料查詢工具列 (Data View Toolbar)

- Admin collection 應使用 `@platform/svelte-ui/data-view-toolbar` 組合 Search、Filter 與 Sort，不在各 route 重複建立固定表單列。
- Inactive controls 保持緊湊；active search、filter rules 與 sort count 必須持續可見。
- Filter 採 Property → Operator → Value，Sort 採有順序的 Property → Direction。
- 完整 query state 由 consumer 同步至 URL，並由 server 在 pagination 前執行。
- Desktop 使用 Popover，窄螢幕使用 Sheet；完整互動與欄位矩陣見 [共用 Data View Toolbar 規格](./data-view-toolbar.md)。

### 4.8 文章設定側欄 (Article Settings)

- CMS 文章編輯頁的桌面 Settings 預設展開，不跨頁面或重新整理保存狀態。
- 展開時，收合按鈕位於 Settings 標題旁；按鈕必須公開 accessible name 與 `aria-expanded`。
- 收合時整個 Settings surface、內容與 layout width 歸零，editor workspace 擴展至釋放的寬度；不可保留空白窄欄。
- 收合後只在文章標題工具列右上角保留一個 Settings 圖示按鈕，再次操作恢復固定寬度的 Settings。
- `lg` 以下沿用既有 Sheet drawer，不使用桌面收合 state，也不改變表單內容。
- Settings、editor canvas、form controls 與 editor chrome 必須使用 `background`、`card`、`muted`、`foreground`、`border` 等語意 token，禁止以固定白色／灰階代替 theme surface。

### 4.9 文章編輯器互動 (Article Editor Interaction)

- Web 直接使用的所有 Tiptap packages 固定為精確 `3.30.5`；workspace 必須將 `prosemirror-model` 去重為單一 runtime instance，Vite bundler 也必須設定 dedupe，避免 paragraph split 等跨 instance 操作失敗。
- 一般 `Enter` 建立新段落，`Shift + Enter` 建立 soft break；只有當目前 paragraph 是完整 HTTP(S) URL 時，`Enter` 才改走 link preview 轉換。
- 桌面 block toolbar 的 hover hit area 包含內容區與左側 gutter；空白列以滑鼠 Y 座標對應最近 block，不要求游標精準命中文字。
- 點擊既有 block 維持 ProseMirror 原生 caret 定位；點擊 block 之間的空白插入 paragraph，點擊文章末端空白則在文件尾端新增 paragraph，並立即聚焦讓使用者直接輸入。
- Article workspace 與桌面 Settings 分別擁有自己的垂直捲動容器；viewport 高度不足時不得以 `overflow: hidden` 裁切尚未顯示的內容。

## 5. 圖標系統 (Iconography)

統一使用 `Lucide React`。

- **Size**:
  - 一般按鈕內: 16px (`size={16}`)
  - 表格操作: 18px (`size={18}`)
  - 大型標題旁: 20px (`size={20}`)
- **Stroke**: 預設 2px，精細顯示可選用 1.5px。

## 6. 開發流程 (Development Workflow)

1.  **新增組件**:
    ```bash
    npx shadcn-ui@latest add [component-name]
    ```
2.  **樣式覆寫**:
    不要直接修改 `components/ui` 內的原始碼（除非是全域性修改）。應優先透過 `className` prop 傳入 Tailwind classes 進行覆寫，使用 `cn()` utility 來合併 classNames。

    ```tsx
    // 範例：客製化一個紅色的外框按鈕
    <Button
      variant="outline"
      className="border-red-500 text-red-500 hover:bg-red-50"
    >
      刪除
    </Button>
    ```

3.  **RWD**:
    優先採用 Mobile-First 策略。側邊欄在 `md` (768px) 以下自動隱藏。

## 7. 程式碼組織規範 (Code Slicing)

採用 **Feature-Based Slicing** (功能切分) 策略，將相關業務邏輯集中管理。

### 7.1 Directory Structure

```
src/
├── routes/                  # SvelteKit Routing (Pages & Layouts)
│   ├── (app)/               # C-side (User) routes
│   └── (admin)/             # Admin-side routes
│       └── admin/
│           ├── +layout.svelte
│           ├── users/       # Page: /admin/users
│           └── roles/       # Page: /admin/roles
├── lib/
│   ├── components/
│   │   └── ui/              # Shared atomic components (shadcn/ui)
│   ├── features/            # Feature Modules (Logic Core)
│   │   ├── admin-users/     # Domain: Admin User Management
│   │   │   ├── components/  # Feature-specific components
│   │   │   │   ├── UserTable.svelte
│   │   │   │   └── UserForm.svelte
│   │   │   ├── api.ts       # API requests
│   │   │   ├── schemas.ts   # Zod validation schemas
│   │   │   └── types.ts     # Feature specific types
│   │   └── admin-roles/     # Domain: Admin Role Management
│   └── utils/               # Shared utilities
```

### 7.2 Rules

1.  **Pages are Shells**: `+page.svelte` 應該只負責處理 Data Loading 與 Layout，主要內容應引入 `features/<domain>/components` 內的 Controller Component。
2.  **Shared vs Feature**:
    - 通用組件 (Button, Card) 放 `lib/components/ui`。
    - 業務組件 (UserList, PermissionTree) 放 `lib/features/<domain>/components`。
3.  **Colocation**: API calls, Zod schemas, Types 與 Component 放在同一個 Feature 資料夾下。
