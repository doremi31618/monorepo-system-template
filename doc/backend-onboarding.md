# Backend Onboarding Guide

協助工程師在 monorepo-auth-fullstack 後端（NestJS + Drizzle）專案中快速完成環境設定、了解常用指令與開發規範。

---

## 1. 先決條件

- Node.js 20+、npm 10+。
- PostgreSQL（可使用 Docker：`docker compose up -d db`）。
- 環境變數：`cp backend/.env.example backend/.env` 並依需求調整 `DATABASE_URL`, `PORT` 等設定。

---

## 2. 安裝與啟動

```bash
cd backend
npm install
npm run start:dev        # 預設 http://localhost:3333 或 .env PORT
```

若 Drizzle schema 有更新，請同步遷移：

```bash
npm run db:generate      # 由 schema 產生 SQL
npm run db:migrate       # 套用至資料庫
```

Swagger 文件位於 `http://localhost:<PORT>/openapi`。

---

## 3. 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run start:dev` | Nest watch mode。 |
| `npm run lint` | ESLint（`@typescript-eslint`）+ 自動修復。 |
| `npm run format` | Prettier 套用於 `src`/`test`。 |
| `npm run test` / `test:watch` / `test:cov` | Jest 單元測試、watch 模式、覆蓋率報告。 |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle 產生 SQL、執行遷移、啟動資料庫工作室。 |

---

## 4. Coding Standard

- **分層**：Controller 僅處理 HTTP/DTO，Service 承載商業邏輯，Repository 封裝 Drizzle 查詢。
- **DTO + Validation**：所有輸入 DTO 採 `class-validator` Decorator，輸出 DTO 採明確型別（如 `UserIdentityDto`）。
- **錯誤處理**：使用 Nest 內建例外 (`BadRequestException`, `UnauthorizedException` …)；交由 `ResponseInterceptor` 統一包裝。
- **安全性**：密碼以 `bcrypt` 雜湊，session token 透過 `crypto.randomUUID()` 產生，敏感設定從 `.env`/`ConfigService` 讀取。
- **日誌**：提供有意義的 log（使用 Nest Logger），避免散落 `console.log`。
- **測試**：Service/Repository 新邏輯需附上 Jest 測試；對外連線（DB、SMTP）以 mock 隔離。

---

## 5. Development Standard

1. **需求追蹤**：建立/更新 `project-progress/*.md`，標記 `[backend]` 工作項。
2. **資料庫治理**：所有 schema 改動須透過 Drizzle 流程，並確認遷移腳本可重複執行。
3. **API 契約**：與前端同步 `lib/api/*` 變更，必要時附上 Swagger 連結或版本資訊。
4. **程式碼審查**：PR 需描述動機、修改內容、測試結果；若涉及敏感流程（登入、權限）需請求額外 reviewer。
5. **觀察性**：複雜流程請加入結構化 log，錯誤路徑以 try/catch 補充 context 便於除錯。

---

## 6. 上線前檢查清單

- [ ] `npm run lint`、`npm run test` 均通過；若有覆蓋率要求需附報告。
- [ ] 相關 Drizzle 遷移已產生並在本機套用成功。
- [ ] Swagger `/openapi` endpoint 反映最新 API。
- [ ] `project-progress` 已更新對應工作項狀態。
- [ ] 若涉及環境變數或基礎建設，已在 README/doc 標註並通知相關人員。

完成以上檢查後即可提交 PR，並附上測試/驗證說明以利審查。
