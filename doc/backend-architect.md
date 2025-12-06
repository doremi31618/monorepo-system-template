# Backend 架構說明

本文件描述 monorepo-auth-fullstack 後端（NestJS）專案的技術棧與分層架構，協助工程師快速理解模組職責與資料流。

---

## 技術棧

- **框架**：NestJS 10（Express 平台）。
- **語言**：TypeScript，使用 `ts-node` 於開發環境執行。
- **資料庫**：PostgreSQL，透過 Drizzle ORM 操作。
- **驗證/安全**：`bcrypt` 處理密碼雜湊，`crypto.randomUUID()` 生成 session token。
- **背景工作**：`@nestjs/schedule` 執行 session 清理 cron。
- **文件**：`@nestjs/swagger` 產生 OpenAPI (`/openapi`)。

---

## 分層與資料流

1. **Controller**（如 `src/auth/auth.controller.ts`）解析 HTTP 請求與回應，僅調用對應 service。
2. **Service**（如 `src/auth/auth.service.ts`）實作商業邏輯：驗證憑證、建立 session、整合 repository。
3. **Repository**（`src/auth/repository/session.repository.ts`, `src/user/user.repository.ts`）負責 Drizzle 查詢與資料存取。
4. **Common/Interceptor**（`src/common/response/response.interceptor.ts`）統一輸出格式 `{ statusCode, message, data, timestamp, path }`。
5. **DB Schema**（`src/db/schema.ts`）定義資料表結構並供 repository 引用。

此分層確保控制器輕量、邏輯集中在 service、資料操作集中在 repository。

---

## 目錄速覽

```
backend/src
├── auth/
│   ├── dto/                  # LoginDto, SignupDto, UserIdentityDto, SignoutDto
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── repository/session.repository.ts
├── user/
│   └── user.repository.ts
├── common/
│   └── response/response.interceptor.ts
├── db/
│   ├── db.ts                 # Drizzle 初始化
│   └── schema.ts             # 資料表定義
├── mail/                     # 寄信與 SES 測試模組
├── main.ts                   # 應用程式進入點
└── app.module.ts             # 模組組合、DI 設定
```

---

## 模組重點

- **AuthModule**
  - `AuthController`：暴露 `/auth/signup`, `/auth/login`, `/auth/inspect`, `/auth/signout` 等端點。
  - `AuthService`：驗證使用者、建立/刪除 session、封裝回傳 DTO。
  - `SessionRepository`：以 Drizzle 操作 `userSessions`，提供建立/查詢/刪除與排程清理。
- **UserModule**
  - `UserRepository`：以 email 查詢、建立使用者。
- **CommonModule**
  - `ResponseInterceptor`：在所有 controller 回傳前包裝資料，維持前後端契約一致。
- **MailModule**
  - 範例 SES / Nodemailer 整合與 `RUN_SMTP_TEST` 控制的測試腳本。

---

## 設計原則

- **單向依賴**：Controller→Service→Repository，不可反向依賴。
- **DTO 驗證**：所有輸入 DTO 使用 `class-validator` Decorator，確保參數安全。
- **統一回應**：全域攔截器確保所有 API 都帶有 `statusCode`、`message`、`data`。
- **錯誤分類**：使用 Nest 內建例外（`BadRequestException`, `UnauthorizedException`, ...）以對應 HTTP 狀態碼。
- **環境管理**：敏感設定來自 `.env`/`ConfigModule`，避免硬編碼。
- **測試優先**：Service/Repository 新增功能時提供 Jest 單元測試；排程與第三方整合以 mock 隔離。

針對新的網域模組，可依上述結構建立 `module + controller + service + dto + repository`，並於 `app.module.ts` 或功能模組中註冊 Provider。

---

## Swagger / OpenAPI 設定

要讓 Swagger UI 顯示 schema 並支援在 UI 內輸入 Authorization header，需同時完成下列調整（專案已設定完成，可作為範例）：

1. **DocumentBuilder 註冊 Bearer Auth**：在 `main.ts` 使用 `.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')`，Swagger UI 會出現 Authorize 按鈕。
2. **Controller 標注 Swagger Decorator**：於 `AuthController` 加上 `@ApiTags('Auth')`、`@ApiOperation`、`@ApiResponse`，需要 token 的端點加 `@ApiBearerAuth('access-token')`。
3. **DTO 標記欄位**：在 `auth/dto/*.ts` 內為每個欄位加 `@ApiProperty`（含 example），Swagger 才能生成對應 schema。

完成後重新啟動 backend，即可在 `http://localhost:<PORT>/openapi` 看到完整的路由、Schema，以及可輸入 token 的 Authorize modal。
