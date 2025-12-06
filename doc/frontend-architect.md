# Frontend 架構說明

本文件描述 monorepo-auth-fullstack 前端（SvelteKit）專案的技術棧、資料流程與目錄劃分，協助工程師在維護或擴充時掌握整體架構。

---

## 技術棧

- **框架**：SvelteKit 2 + Svelte 5，採檔案式路由。
- **語言**：TypeScript，全域啟用嚴格型別。
- **樣式**：TailwindCSS 4，並以 Bits UI 元件作為 UI primitives。
- **建構工具**：Vite 5/7，搭配 Storybook 10 進行元件開發。
- **Lint & Format**：ESLint（Flat config）+ Prettier。

---

## 資料流程

1. **UI 模組**（`src/lib/module/*`）定義具體的表單或 Feature 元件，僅處理使用者互動。
2. **Store**（`src/lib/store/authStore.ts` 等）管理狀態、呼叫 API 並處理導頁／快取。
3. **API 包裝層**（`src/lib/api/*.ts`）負責對應後端端點、轉換 payload。
4. **HTTP Client**（`src/lib/api/httpClient.ts`）統一處理 `fetch`、Base URL、token 與錯誤訊息。
5. **Config**（`src/lib/config/*`）集中定義路徑與 App 設定，供各層共用。

此流程確保 UI 與資料邏輯解耦，方便測試與重複利用。

---

## 目錄速覽

```
frontend/src
├── routes/                 # SvelteKit 檔案式路由
│   ├── +layout.svelte
│   ├── auth/login/+page.svelte
│   └── user/+layout.svelte
├── lib/
│   ├── api/                # httpClient 與各模組 API
│   ├── components/         # 共用 UI 組件（含 Bits UI wrapper）
│   ├── config/             # AppConfig、route 定義
│   ├── module/             # feature 細分（auth 登入/註冊表單等）
│   ├── store/              # Svelte store（authStore 等）
│   └── utils.ts            # 共用工具
└── app.css & assets        # 全域樣式與靜態資源
```

| 目錄 | 功能 |
| --- | --- |
| `src/lib/api/httpClient.ts` | 定義 `ApiResponse<T>`、統一附加 headers、處理錯誤訊息。 |
| `src/lib/api/auth.ts` | 封裝登入／註冊／Inspect session 等 HTTP 呼叫。 |
| `src/lib/store/authStore.ts` | 以 `writable` 管理 session，提供 `login/register/logout/refresh`。 |
| `src/lib/module/auth/*` | 登入、註冊等表單模組，與頁面解耦，方便在不同 route 重用。 |
| `src/routes/user/+layout.svelte` | 受保護的 dashboard layout，透過 store 決定是否導回登入頁。 |

---

## 關鍵設計原則

- **單一責任**：頁面只組合模組與 store，所有資料操作集中在 API/store。
- **型別明確**：DTO 與前端 domain 型別分離，所有函式具明確回傳型別。
- **錯誤集中處理**：HTTP 錯誤統一由 `httpClient` 轉換，避免分散在各頁面。
- **可擴充性**：路由、API base URL、儲存鍵值皆放在 `config`，方便依環境覆寫。
- **SSR 友善**：存取 `localStorage` 需受 `browser` 守衛，並於 store/guard 中統一處理。

如需新增功能，建議依上述層次新增對應模組，並在 `project-progress` 記錄工作項目。
