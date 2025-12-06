# Project Architecture Overview

本文件說明 **monorepo-auth-fullstack** 的整體系統架構，涵蓋技術棧、部署拓樸、前後端協作方式與跨切面考量，作為快速了解專案全貌的入口。

---

## 1. Monorepo 結構

```
monorepo-auth-fullstack/
├── backend/       # NestJS + Drizzle REST API
├── frontend/      # SvelteKit + Tailwind Web App
├── doc/           # 文件（含本檔、架構/Onboarding 指南）
├── project-progress/  # 進度與工作項目紀錄
├── SQLScripts/    # 額外 SQL 腳本
├── scripts/       # 自動化腳本
└── docker-compose.yml / README.md
```

- 單一 Git repo 管理前後端，確保 API 契約、開發流程與文件保持同步。
- `docker-compose.yml` 提供一鍵啟動（frontend + backend + Postgres）。

---

## 2. 高階技術棧

| 層級 | 技術 | 摘要 |
| --- | --- | --- |
| Frontend | SvelteKit 2, Svelte 5, TypeScript, TailwindCSS 4, Bits UI, Storybook | 檔案式路由、Store 驅動的狀態管理，搭配 Vite dev server。 |
| Backend | NestJS 10, TypeScript, Drizzle ORM, PostgreSQL, bcrypt, `@nestjs/schedule`, `@nestjs/swagger` | 模組化 REST API，提供登入/註冊/Session 管理。 |
| 共用 | Docker Compose, Node.js 20+, ESLint + Prettier, Vitest/Jest, Playwright | 以 Node 工具鏈與 linters 確保程式品質。 |

---

## 3. 部署與執行拓樸

```
[Browser] ⇄ [SvelteKit (frontend)] ⇄ HTTP/JSON ⇄ [NestJS (backend)] ⇄ Drizzle ⇄ [PostgreSQL]
                                                         │
                                                         └─ (可選) AWS SES / SMTP for emails
```

- Frontend 透過 `AppConfig.apiBaseUrl` 指向 backend；預設 `http://localhost:3333`。
- Backend 暴露 `/auth/*` API，並透過 Drizzle 讀寫 PostgreSQL。`SessionCleanupService` 以 cron 刪除過期 session。
- Swagger (`/openapi`) 提供 API 文件；未來可用同一 repo 進行 CI/CD，部署到容器或 serverless。

---

## 4. 前後端協作模型

1. **API 契約**  
   - Backend 使用 `ResponseInterceptor` 統一回傳 `{ statusCode, message, data, timestamp, path }`。  
   - DTO 使用 `class-validator` 保障輸入格式；Swagger decorator 讓 API 自動文件化。  
   - Frontend `httpClient` 解析 `ApiResponse<T>`，store 依 `statusCode` 決定導頁或顯示錯誤。

2. **狀態與 Session**  
   - Backend `SessionRepository` 產生 `sessionToken` 並回傳 `UserIdentityDto`。  
   - Frontend `authStore` 保存 session，寫入 `localStorage`（僅在 `browser` 環境）。  
   - Route guard (`user/+layout.svelte`) 依 store 決定是否導回登入頁。

3. **工作流程**  
   - 每個需求先在 `project-progress` 建立工作項，標記 `[frontend]` / `[backend]`。  
   - 透過 feature branch + PR 協作，PR 需附上 lint/test 結果與驗證方式。

---

## 5. 跨切面考量

### 安全
- 密碼使用 `bcrypt` 雜湊；session token 以 `crypto.randomUUID()` 產生並存 DB。
- CORS 由 `app.enableCors({ origin: true, credentials: true })` 控制。
- Swagger 可透過 `.addBearerAuth()` 與 `@ApiBearerAuth` 提供 Authorization header 測試。

### 可觀測性與錯誤處理
- Backend 透過 Nest Logger 與結構化例外（`BadRequestException` 等）傳遞錯誤。
- Frontend `httpClient` 以 `safeErrorMessage` 對所有 HTTP 錯誤統一處理，避免頁面崩潰。

### 可維護性
- Docs 已拆分：`frontend-architect`, `backend-architect`, `frontend-onboarding`, `backend-onboarding`，並在 `how-to-start-dev-env.md` 連結。
- Config 與常數集中於 `frontend/src/lib/config` 與 `backend/.env`，方便依環境覆寫。
- Drizzle schema 與遷移流程 (`db:generate`/`db:migrate`) 確保資料庫演進可追溯。

---

## 6. 參考文件

- [如何啟動開發環境](./how-to-start-dev-env.md)
- [Frontend 架構說明](./frontend-architect.md)
- [Backend 架構說明](./backend-architect.md)
- [Frontend Onboarding Guide](./frontend-onboarding.md)
- [Backend Onboarding Guide](./backend-onboarding.md)

如需拓展架構（例如加入 Google SSO、Refresh Token、微服務拆分），請先更新本文件並於 `project-progress` 建立對應工作項。
