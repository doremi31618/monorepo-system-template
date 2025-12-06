# Frontend Onboarding Guide

協助工程師在 monorepo-auth-fullstack 前端專案中快速完成環境建置、了解常用指令與開發規範。

---

## 1. 先決條件

- Node.js 20+、npm 10+。
- 建議開發工具：VS Code（含 Svelte、TypeScript、Tailwind 插件）。
- 若需一次啟動整套服務，請安裝 Docker Desktop（或 Docker Engine + Compose v2）。

---

## 2. 安裝與啟動

```bash
cd frontend
npm install
npm run dev        # 預設 http://localhost:5173
```

前端會使用 `src/lib/config/index.ts` 的 `AppConfig.apiBaseUrl` 與後端溝通，預設為 `http://localhost:3333`。如後端埠號不同，請於此檔調整。

---

## 3. 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動 Vite dev server，支援 HMR。 |
| `npm run build` / `npm run preview` | 建置並預覽產線 bundle。 |
| `npm run check` | 執行 `svelte-check` + TypeScript 檢查。 |
| `npm run lint` | `prettier --check` + ESLint（Flat config）。 |
| `npm run format` | 使用 Prettier 套用格式。 |
| `npm run storybook` / `npm run build-storybook` | 開發或建置 UI 元件文件。 |

---

## 4. Coding Standard

- **TypeScript First**：所有檔案使用 `.ts/.svelte` 並補上顯式型別；避免 `any`。
- **模組化路由**：頁面 (`src/routes/*`) 保持輕量，商業邏輯放在 `src/lib/module` 或 store。
- **狀態管理**：共用 session 狀態由 `authStore` 管理；若新增 store，提供 `subscribe`/method API 並封裝副作用。
- **匯入別名**：統一使用 `$lib/*`, `$app/*` 避免相對路徑地獄。
- **UI 指南**：優先使用 `src/lib/components/ui/*` 封裝元件；客製樣式以 Tailwind utility classes 為主。
- **Lint/Format**：提交前必須通過 `npm run lint` 與 `npm run check`。PR 附上測試/驗證結果。

---

## 5. Development Standard

1. **需求追蹤**：任何新功能或修正需在 `project-progress/*.md` 建立工作項（註明 `[frontend]`）。
2. **Branch Flow**：建議命名 `feature/<scope>-<desc>`；PR 說明包含背景、修改點、驗證方式。
3. **測試與驗證**：
   - UI/互動：至少進行手動 smoke test；元件層可新增 Storybook stories 或 Vitest + Playwright 測試。
   - Store/utility：善用 Vitest 撰寫單元測試。
4. **錯誤處理**：API 回傳需保留 `statusCode`、`message`；UI 需能顯示錯誤訊息而非直接丟例外。
5. **可維護性**：共用常數、路由、API path 由 `src/lib/config` 管理；表單驗證邏輯抽成 util 方便重複使用。

---

## 6. 上線前檢查清單

- [ ] `npm run lint`、`npm run check` 均通過。
- [ ] 主要流程（登入 / 註冊 / 登出 / 受保護頁）手動驗證成功。
- [ ] 新增/修改的工作項於 `project-progress` 更新狀態。
- [ ] 若需後端配合，已同步 Swagger 變更或 API 契約。

完成上述步驟後即可提出 PR，並附上驗證截圖或錄影以利審查。
