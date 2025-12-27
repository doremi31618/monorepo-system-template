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

## 6. Architecture & Governance (Core R1)

本專案採用嚴格的分層架構 (Hexagonal-like) 與模組邊界治理。

### 6-1. Module Layers & Boundaries (Nx Tags)
專案模組分為三個層級，透過 Nx Tags 強制隔離：

| Scope | Tag | Description | Dependencies Allowed |
| :--- | :--- | :--- | :--- |
| **Infra Core** | `scope:infra-core` | 底層技術實作 (DB, Logger, Config, AuthBase)。 | 🚫 **無** (不可依賴 Domain 或 Feature)。 |
| **Domain Core** | `scope:domain-core` | 純粹商業邏輯 (User)。包含 Entity, Repository Interface。 | ✅ Depends on `scope:infra-core`。<br>🚫 **不可依賴 Feature**。 |
| **Feature** | `scope:feature` | 具體應用模組 (Controller, App Logic)。組合 Domain 與 Infra 完成功能。 | ✅ Depends on `scope:infra-core`, `scope:domain-core`。 |

**重要規則**：
- `UserModule` (Domain) **不可** 依賴 `AuthModule` (Infra)。
- 任何 Module 均可依賴 `@share/contract` (Shared)。

### 6-2. Drizzle Schema Governance
- **Ownership**: Schema 定義必須放在各自的 Module 中 (e.g. `core/domain/user/user.schema.ts`)。
- **Aggregator**: `core/infra/db/schema.ts` 僅作為 Drizzle **Runtime & Migration** 的聚合點。
    - ❌ **禁止** 任何 Feature Module import `core/infra/db/schema.ts`。
    - ✅ Feature 應直接 import 該領域的 Schema (e.g. `import { users } from '@/core/domain/user/user.schema'`)。

### 6-3. Dependency Injection (DI) Rules
- **Interface Segregation**: 在跨層級依賴時，優先依賴 **Interface** 而非實作。
    - ✅ `AuthService` injects `IUserService` (Interface)。
    - ❌ `AuthService` injects `UserRepository` (Concrete Class)。
- **Provider Export**: `UserModule` 必須 `exports: [IUserService]` 才能讓其他模組使用。

---

## 7. Logger & Error Handling

專案採用統一的 `LoggerService` 與 `GlobalExceptionFilter` 確保日誌格式（JSON in Prod）與錯誤回應一致。

### 如何使用 Logger
本專案的 `LoggerService` (`core/infra/logger`) 繼承自 NestJS `ConsoleLogger` 並實作了環境感知 (JSON/Pretty)。

**在 Service / Controller 中使用 (推薦)**：
請透過 Dependency Injection (DI) 注入：
```typescript
import { LoggerService } from '@/core/infra/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(MyService.name);
  }

  doSomething() {
    this.logger.log('Starting operation...', { userId: 123 }); // 支援結構化物件
    this.logger.warn('Something suspicious happened');
    this.logger.error('Operation failed', error.stack);
  }
}
```

### Log Levels 原則
- **Error**: 系統異常、預期外的錯誤 (5xx)。
- **Warn**: 業務邏輯拒絕、驗證失敗 (4xx)、可恢復的錯誤。
- **Log**: 關鍵流程節點 (e.g. 登入成功、訂單建立)。
- **Debug**: 開發除錯用的詳細資訊 (Production 預設不顯示)。

### Exception Handling
已全域啟用 `GlobalExceptionFilter`，所有拋出的例外皆會轉為 `ApiResponse<null>` 格式。

- **一般錯誤**：直接拋出 NestJS 內建 Exception。
  ```typescript
  throw new BadRequestException('Invalid input');
  // Response: { statusCode: 400, message: 'Invalid input', error: 'Bad Request', ... }
  ```
- **未知錯誤**：任何非 HttpException 的錯誤都會被捕捉並記錄為 500 (Internal Server Error)，以避免敏感資訊外洩。

### Request Logging
已啟用 `LoggingInterceptor`，自動記錄所有請求的 Method / URL / Status Code / Duration (ms)。

---

## 8. 上線前檢查清單

- [ ] `npm run lint`、`npm run test` 均通過；若有覆蓋率要求需附報告。
- [ ] 相關 Drizzle 遷移已產生並在本機套用成功。
- [ ] Swagger `/openapi` endpoint 反映最新 API。
- [ ] `project-progress` 已更新對應工作項狀態。
- [ ] 若涉及環境變數或基礎建設，已在 README/doc 標註並通知相關人員。

完成以上檢查後即可提交 PR，並附上測試/驗證說明以利審查。
