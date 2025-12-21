

⸻

# Core Module Progress Report (Milestone 1)

Last updated: 2025-12-05

Review action：依 2025-12-05 review，先完成「Pre-M1 Monorepo Bootstrap」（Nx init + workspace + `/scripts` → Nx），再進入 Core 重構與模組遷移。


## 🎯 Acceptance Criteria（R1-core）

**Pre-M1 — Monorepo Bootstrap**
•	root package.json + pnpm-workspace.yaml + lockfile；Nx init 完成並註冊 backend/frontend app。
•	`/scripts` 改為 Nx target 或 npm script alias 指向 nx；nx graph/lint 可執行（tags scaffold 就緒）。

**Core Refactor & Governance**
1. Core 結構與邊界：backend/src/core 下完成 core/domain/user（schema/repo/service/IUserService）與 core/infra（config/db/logger/auth-base/utils）；Feature → Domain → Infra；禁止 Feature 直接使用 core/infra/db/schema.ts；Nx graph 無循環依賴。
2. Config system：schema 驗證、typed getter、移除隨處 process.env。
3. Database layer：BaseEntity、BaseRepository、transaction helper；User domain fully on BaseRepository；Schema 按 Domain/Infra/Feature 分層；Drizzle aggregator 只收集 schema。
4. Logger & Error：JSON logger；GlobalExceptionFilter；LoggingInterceptor。
5. Auth Base：IUserService + UserIdentity；AuthGuardBase；@CurrentUser decorator；正確依賴 UserService（Domain Core）。
6. Shared utilities：pagination/date/id 等至少被兩個 module 使用。
7. Nx Workspace：tags scope:infra-core/scope:domain-core/scope:feature；Lint boundary rules；nx graph 驗證依賴方向（Nx init 已於 Pre-M1 完成）。
8. CI/CD（Nx runner）：build/test/lint 改用 Nx；啟用 Nx cache；預留 nx affected；CI 指令透過 Nx target（含 /scripts 映射）。
9. 開發規範文件：DEVELOPMENT_GUIDE.md，含 Schema Ownership、Module Boundary、命名/結構、DI 原則、禁止 import aggregator schema、Commit/PR checklist、如何新增 domain/feature module。
10. 模組遷移：`src/user` → `core/domain/user`；`src/auth` → `core/infra/auth`；`src/db/schema.ts` 拆分並更新 Drizzle aggregator；import 更新且 nx graph/lint 無違規。

⸻

## Product Feature Spec

| Feature / capability | Status | Notes |
| --- | --- | --- |
| Pre-M1 Monorepo bootstrap | 🔄 In Progress | Root package.json + pnpm workspaces + lockfile；Nx init with backend/frontend apps；scripts → Nx target/alias；nx graph runnable. |
| Core structure (Domain + Infra) | 🔄 In Progress | backend/src/core split into core/domain and core/infra with enforced boundaries. |
| Domain Core (User) | ⏳ Planned | User schema/repository/service; implements IUserService for AuthBase and feature modules. |
| Config system | ⏳ Planned | ConfigModule with schema validation, environment profiles, typed getters; no direct process.env. |
| Database layer (Drizzle) | 🔄 In Progress | DatabaseModule, Drizzle setup, BaseEntity/BaseRepository, runInTransaction; schema split by layer; aggregator only for DB client/migration. |
| Logger & error handling | ⏳ Planned | JSON logger, LoggingInterceptor, GlobalExceptionFilter with unified envelope. |
| Auth base (non-RBAC) | ⏳ Planned | UserIdentity, IUserService token, AuthGuardBase, @CurrentUser decorator; Domain Core supplies IUserService. |
| Shared utilities | ✅ Done | Pagination/date/id utilities; **Shared HttpClient/StorageService (@share/sdk)**; reused by ≥2 modules. |
| Nx Workspace (backend + frontend) | 🔄 In Progress | Tags scope:infra-core/scope:domain-core/scope:feature; lint boundary rules; nx graph after migration confirms direction; Nx init done in Pre-M1. |
| CI/CD on Nx | ⏳ Planned | CI pipeline uses nx build/test/lint; Nx cache enabled; nx affected wired for future use; legacy scripts mapped to Nx target. |
| Development guidelines | ⏳ Planned | DEVELOPMENT_GUIDE.md covering schema ownership, module boundaries, DI, naming/structure, PR checklist. |
| Migration (auth/user + schema) | ⏳ Planned | src/user → core/domain/user；src/auth → core/infra/auth；src/db/schema.ts split; imports updated; Nx graph clean. |
| Backend Scheduling (PG-Queue) | ⏳ Planned | **ADR-002**: JobSchedulerPort interface; Producer (Unique Key idempotency); Consumer (SELECT FOR UPDATE SKIP LOCKED); No Redis needed. |

⸻

## Overall status snapshot
 • ⏳ In Progress / Planned: Pre-M1 monorepo bootstrap（Nx init + scripts 映射）、Domain Core（User）、Infra Core（config/db/logger/auth-base/utils）、Nx tags + boundary lint、DEVELOPMENT_GUIDE、CI migration to Nx、auth/user/schema migration。
 • ❌ Not Started: Core extraction to shared library（future milestone）、downstream integrations、release tagging。

⸻

## Architecture & governance（R1-core alignment）

**Core layering**
 • Feature Modules → Domain Core → Infra Core
 • Domain Core consumes Infra Core；Feature Modules consume Domain Core；no upward dependencies。
 • 執行順序：先完成 Pre-M1（Nx init + workspace + scripts 映射），再開始 Core 重構與模組遷移。

**Schema ownership**
 • Domain schemas：core/domain/...
 • Infra schemas：core/infra/...
 • Feature schemas：modules/<feature>/...
 • Each schema owned by its module；domain schema 不放在 feature；infra schema 僅提供底層支援。

**Drizzle schema aggregator**
 • core/infra/db/schema.ts 只提供給 Drizzle client/migration。
 • 不 export *；不是 feature 的 entry point；禁止外部依賴 aggregator。

**Nx tags & boundary rules**
 • core/infra/* → scope:infra-core
 • core/domain/* → scope:domain-core
 • modules/* → scope:feature
 • Rules: feature → domain/infra；domain-core → infra；infra-core → no domain/feature。

**Packaging strategy**
 • Milestone 1：Core 保留在 backend/src/core。
 • Future milestone：第二個 backend 出現後再抽成共享 library（libs/core 或 @app/core）。

⸻

## Tech Spec — Shared API/DTO（Auth）
 • 契約套件：libs/contracts（importPath 建議 @monorepo/contracts），只放 TS interface/type + route 常數；Nest DTO 維持 class-validator decorator，透過 implements shared interface 取代重複型別。
 • Response envelope：ApiResponse<T> = { statusCode: number; message: string; data?: T | null; error?: string | null; timestamp?: string; path?: string }（backend/src/common/response/response.interceptor.ts 與 frontend/src/lib/api/httpClient.ts 需共用）。
 • API/DTO 需搬到 shared/auth：
   - POST /auth/login → AuthLoginRequest { email; password }；Response AuthSession { token: string; refreshToken?: string; userId: number; name: string }（backend LoginDto/UserIdentityDto；frontend Session）。
   - POST /auth/signup → AuthSignupRequest { email; password; name }；Response AuthSession 同上。
   - POST /auth/signout → Bearer token；Response AuthSignoutResponse { userId: number }（backend SignoutDto；frontend logout 回傳 { userId }）。
   - GET /auth/inspect → Bearer token；Response AuthSessionInspect { token: string; refreshToken?: string; userId: number; expiresAt: string; createdAt: string; updatedAt: string; name?: string }（backend SessionDto.sessionToken 對應 token，補 name/refreshToken 時可沿用）。
   - POST /auth/refresh → Cookie refreshToken；Response AuthRefreshResponse { token: string; refreshToken?: string }（目前 backend 傳 sessionToken；frontend 期望 token，需統一欄位）。
   - POST /auth/reset/request → PasswordResetRequest { email }；Response PasswordResetRequestResponse { token: string; expiresAt: string; resetLink: string }。
   - POST /auth/reset/confirm → PasswordResetConfirmRequest { token; password }；Response PasswordResetConfirmResponse { userId: number; redirect?: string }。
   - Google OAuth login/signup/callback：為瀏覽器 redirect 流程，不需共享 DTO。
 • Frontend 清理：$lib/api/auth.ts（Session, UserBasicInfo）、$lib/api/httpClient.ts（ApiResponse）改由 shared 匯入；authStore 狀態沿用 shared.AuthSession。
 • Backend 對齊：Login/Signup/Reset* DTO implements 對應 shared request；SessionDto/UserIdentityDto/SignoutDto implements shared response 並用 @ApiProperty/@Is* decorator；sessionToken → token 命名需對齊 shared。
 • Nx build 接線：nx g @nx/js:lib contracts --directory=libs --importPath=@monorepo/contracts --projectNameAndRootFormat=as-provided --bundler=tsc（或同等生成指令）；在 libs/contracts/src/index.ts 匯出契約並於 backend/frontend tsconfig 加上 path alias；CI/root 指令改為 nx run-many --target=build --projects=contracts,backend,frontend（或 --all），並在 targetDefaults.build.dependsOn 含 "^build" 以確保 contracts 先建置。

Todo checklist
 - [x] 跑 nx build backend / nx build frontend / nx graph 確認工作區正常
 - [x] 建立 shared 套件（libs/contracts 或同等路徑），定義 Auth/User 契約與 API base path
 - [x] Backend DTO/Swagger 改用 shared 型別，補 class-validator wrapper 並更新 tsconfig path
 - [x] Frontend tsconfig alias 指向 shared，API client 型別改用 shared，移除重複介面
 - [x] 拆分 auth/user schema 至 core 層級並更新 Drizzle aggregator 與 repository import
 - [x] 設定 Nx tags + lint 邊界（scope:infra-core/domain-core/feature），跑 lint/graph 驗證 <!-- id: 5 -->
 - [x] **Config System**: 實作 Schema/Validation (Zod/Joi) 並移除直接 env 存取
 - [x] **Logger & Error Handling**: 實作 JSON Logger, GlobalExceptionFilter, LoggingInterceptor (Design & Guide Completed)
 - [ ] **Domain Core Implementation**: 實作 BaseRepository, UserRepository, 並調整 AuthModule 依賴 IUserService
 - [ ] **Auth Base Refinement**: 確認 @CurrentUser 與 UserIdentity 標準化
 - [ ] **Documentation**: 撰寫 DEVELOPMENT_GUIDE.md
 - [ ] **CI/CD**: 設定 GitHub Actions 執行 nx build/test/lint
 - [ ] **Backend Scheduling**: 實作 JobSchedulerPort, Producer (Idempotency), Consumer (Locking) [ADR-002]
 - [ ] 驗收後標記 Core v0.1.0 baseline

⸻

Deliverables
 • Pre-M1 monorepo bootstrap（root package.json + pnpm workspace + Nx init + scripts → Nx target/alias）。
 • Domain Core + Infra Core structure in backend/src/core.
 • Layered schema governance（domain/infra/feature）+ Drizzle aggregator in core/infra/db/schema.ts。
 • Nx workspace with tags + boundary lint + graph validation。
 • CI/CD using Nx runner + cache；nx affected ready。
 • Migration 完成（auth/user + schema 拆分 + import 更新）。
 • DEVELOPMENT_GUIDE.md covering project conventions。
 • Core v0.1.0 baseline。

⸻

## TODO (WBS) — ordered by dependency

**Pre-M1 Monorepo bootstrap**
 • 建立 root package.json、pnpm-workspace.yaml、lockfile。
 • Nx init + 註冊 backend/frontend apps；加上基本 build/test/lint target。
 • 將 `/scripts` 轉為 Nx target 或 script alias；更新 README/開發指令。
 • 跑 nx graph/format/lint 確認 workspace 正常。

**Infra Core foundation**
 • [x] [infra/config] ConfigModule with schema validation, typed getters; remove direct env access.
 • [x] [infra/db] Drizzle setup, BaseEntity/BaseRepository, runInTransaction; layered schemas; aggregator limited to DB usage.
 • [infra/logger] JSON CoreLogger, LoggingInterceptor, GlobalExceptionFilter.
 • [infra/auth-base] UserIdentity, IUserService token, AuthGuardBase, @CurrentUser decorator.
 • [infra/utils] Shared utilities (pagination/date/id) reused across modules.

**Shared SDK (@share/sdk)**
 • [x] Setup `@share/sdk` package and structure.
 • [x] `StorageService`: Generic storage wrapper with localStorage support.
 • [x] `HttpClient`: Generic HTTP client with token refresh logic (migrated from frontend).
 • [x] Export `SDK` namespace and configure tsconfig paths.

**Domain Core (User)**
 • [domain/user] UserEntity schema; UserRepository extends BaseRepository; UserService implements IUserService.

**Migration: existing modules（auth/user + schema）**
 • 移動 src/user → core/domain/user；更新 import/path + Nx tags。
 • 移動 src/auth → core/infra/auth；守住只依賴 IUserService。
 • 拆分 src/db/schema.ts 為 domain/infra/feature schemas；更新 Drizzle aggregator；清理舊引用。
 • 跑 nx graph/lint 確認無循環與邊界違規。

**Integration: CoreModule**
 • Wire Infra Core + Domain Core under CoreModule; replace ad-hoc infra usage in backend modules。

**Nx Workspace（邊界治理）**
 • Add tags scope:infra-core / scope:domain-core / scope:feature and lint boundary rules; validate with nx graph after遷移。

**Documentation & governance**
 • Write DEVELOPMENT_GUIDE.md（schema ownership、module boundaries、DI、命名/結構、commit/PR checklist、how to add domain/feature modules）。
 • Add boundary lint checks to CI.

**CI/CD migration to Nx**
 • Switch CI jobs to nx build/test/lint; enable Nx cache; add nx affected pipeline scaffold.
 • 將 legacy scripts 的 CI 入口改為 Nx target。

**Release milestone**
 • Tag core v0.1.0 after acceptance checks; smoke test core usage in backend modules。

⸻

**Refactor plan（共享契約導入順序）**
 • 確認 Nx target 可跑：nx build/test/lint/graph；/scripts 是否映射 Nx。
 • 建立 shared 契約套件（建議 libs/contracts）：API path 常數 + Auth/User DTO/type。
 • Backend 導入 shared：Nest DTO 使用 shared 型別（必要時 class-validator wrapper）、更新 tsconfig path，清理重複定義。
 • Frontend 導入 shared：tsconfig alias 指向 shared；API client/型別統一從 shared 取得。
 • 資料層拆分：auth/user schema 依 Domain/Infra/Feature 拆至 core；Drizzle aggregator 僅 infra/db 使用。
 • 品質與 CI：Nx tags/lint 邊界驗證；CI 改用 nx build/test/lint/type-check。

⸻


## Roadmap position
| Milestone | 名稱 | 狀態 | 內容摘要 |
|-----------|------|--------|------------|
| **1** | Core（Domain + Infra）＋ Monorepo Bootstrap、Schema 治理、Nx 初始化 | ⏳ 進行中 | Pre-M1 Nx init + scripts 整合 → Core 架構重整、DB Schema Boundary、Nx、CI/CD、開發規範 |

⸻

## Working Diary

### 2025-12-09

- **Monorepo Shared Library Setup**:
  - Initialized `@share/contract` package manually for sharing Typescript interfaces between backend and frontend.
  - Resolved module resolution issues for both frontend (Vite/SvelteKit) and backend (NestJS/CommonJS) to support sourcing directly from `src` (no build step needed for dev).
    - Frontend: Added `customConditions: ["monorepo-system-template"]` in `tsconfig` and `vite.config.ts`.
    - Backend: Configured `paths` in root `tsconfig.base.json` and extended it in backend `tsconfig.json`.
  - Implemented `SessionDto` in shared contract using `class-validator` decorators.
  - Enabled `experimentalDecorators` in shared library to support `class-validator`.
  - Updated Frontend `auth.ts` and Backend `auth.dto.ts` to import `SessionDto` from `@share/contract`.

- **Next Steps**:
  - Continue implementing other DTOs in the shared library.
  - Refactor other modules to use the monorepo structure.
  - Consider migrating to full Nx generator workflow for future libraries to automate config management.


### 2025-12-11

- **Refactor `HttpClient` to Shared SDK**:
  - Moved generic generic `StorageService` and `HttpClient` logic from frontend to `@share/sdk`.
  - Implemented `SDK.Frontend.HttpClient` in `@share/sdk` with generic support, internal `StorageService` usage, and automatic token refresh logic.
  - Updated `@share/sdk` to export `SDK` namespace containing `Frontend` modules.
  - Added `@share/sdk` to `tsconfig.base.json` paths for monorepo resolution.
  - **Frontend Update**:
    - Replaced `frontend/src/lib/api/httpClient.ts` with instantiation in `frontend/src/lib/utils.ts` using `SDK.Frontend.HttpClient`.
    - Updated `AppConfig` injection into the shared client.
    - Updated `auth.ts` to import `httpClient` from `../utils`.
  - Verified structure and imports.

- **Backend Core Refactoring**:
  - Restructured backend references to align with `core` directory structure.
  - Implemented nested module structure: `InfraModule` (imports `DbModule`, `MailModule`, `AuthModule`) and `DomainModule` (imports `UserModule`).
  - Cleaned up `AppModule` to delegate to `InfraModule` and `DomainModule`.
  - Fixed circular dependency handling in `AuthModule`.

- **Coding Standards & Quality**:
  - Established `doc/coding-standards.md`.
  - Refactored `AuthService` and `AuthController` to return typed DTOs (`UserIdentity`) instead of raw entities.
  - Simplified `ResponseInterceptor` to handle uniform API responses.

- **Bug Fixes**:
  - Fixed `bcrypt` type definition errors in backend.
  - Resolved `auth.service.spec.ts` unit test failure (`Expected 1 arguments, but got 0` in mock).
  - Addressed `browser` global variable type error in frontend types.

- **DB Schema Architecture**:
  - Refactored `drizzle.config.ts` to use glob patterns (`src/**/*.schema.ts`) for automatic schema discovery during migrations.
  - Verified with `db:generate` and build checks.
  - Moved schema files to "owned" modules:
    - `src/core/domain/user/user.schema.ts`
    - `src/core/domain/auth/auth.schema.ts`
    - `src/core/infra/mail/mail.schema.ts`
  - Updated `src/core/infra/db/schema.ts` to export from new locations.

- **Linting Infrastructure & Governance**:
  - **Migrated Backend to ESLint 9 (Flat Config)**: Converted `.eslintrc.js` to `eslint.config.mjs` to resolve version mismatch with root workspace (ESLint 9 vs 8).
  - **Enforced Module Boundaries**: Configured `import/no-restricted-paths` to prevent architectural violations:
    - Infra Core cannot import Domain/Feature.
    - Domain Core cannot import Feature.
    - Shared cannot import Backend logic.
  - **Exempted Schema Aggregator**: Configured `src/core/infra/db/schema.ts` to bypass boundary rules (required for Drizzle Runtime).

- **ESM Migration (Backend)**:
  - Enabled `"type": "module"` in `backend/package.json` to support ESM-only `@share/contract`.
  - Ran migration script to append `.js` extensions to all relative imports and resolve `src/` aliases.
  - Disabled `@nestjs/swagger` CLI plugin temporarily (incompatible with ESM build) to resolve `Debug Failure` crash.
  
- **Schema Refactoring (Runtime Fix)**:
  - Flattened `src/core/infra/db/schema.ts` exports (removed `userModel`/`authModel` nesting) to resolve Drizzle runtime `TypeError`.
  - Updated all usages in repositories/services (e.g. `schema.userModel.users` -> `schema.users`) via migration script.

- **Docker Configuration Fix**:
  - Resolved `npm error 404` for locally shared packages (`@share/*`) during `docker compose build`.
  - Updated `docker-compose.yml` build context to Root (`.`) and mapped workspaces volumes.
  - Refactored `Dockerfile.dev` (Backend & Frontend) to copy full monorepo context (Root package.json + `share/` dir).
  - Configured build to skip `package-lock.json` copying to force fresh workspace resolution inside containers.

### 2025-12-12

- **Environment Configuration Refactoring**:
  - Implemented centralized environment validation using Zod in `src/core/infra/config/env.validation.ts`.
  - Refactored `AppModule` to use `ConfigModule` with strict schema validation; removed direct `process.env` usage.
  - Created domain-specific config files:
    - `auth.config.ts`: Google SSO credentials (injected into `GoogleService`).
    - `mail.config.ts`: SMTP settings (injected into `MailService`).
    - `app.config.ts`: General app settings.
  
- **Database Configuration Refactor**:
  - Refactored `DbModule` to use `useFactory` (Async Provider) for creating connection pool.
  - Dependency injected `ConfigService` into `DbModule` to ensure `DATABASE_URL` is validated before connection creation.
  - Removed side-effect connection logic from `db.ts`.

- **Verification**:
  - Confirmed all backend modules (`Auth`, `Mail`, `Db`) are using injected configuration.
  - Validated build success (`nx build backend`).

### 2025-12-17

- **Logger & Error Handling Research (Phase 1)**:
  - Investigated requirements for centralized logging and error handling.
  - Verified `ApiResponse` contract in `@share/contract` to ensure consistent error envelopes.
  - **Designed "Smart Logger" Architecture**:
    - Switches between JSON (Production) and Pretty Print (Development) modes based on `NODE_ENV`.
    - Leverages existing `AppConfig` for environment detection.
  - **Documentation**:
    - Created detailed implementation guide: `doc/implementation-guides/logger-and-error-handling.md`.
    - Guide covers: `LoggerService`, `GlobalExceptionFilter`, `LoggingInterceptor`, and `main.ts` integration.
    - Archived plan for future implementation by team.

### 2025-12-19

- **Backend Scheduling Strategy (Scaling Best Practices)**:
  - **Context**: Preventing duplicate execution of `@Cron` jobs when horizontally scaling backend containers (e.g., 3 replicas).
  - **Decision**: Hybrid Approach (PG-Queue). Avoid Redis complexity; use PostgreSQL for idempotency and queueing.
  - **Technical Specs**:
    1. **Architecture**: Decouple logic via `JobSchedulerPort` interface (allows future migration to Redis/BullMQ).
    2. **Producer (Idempotency)**: Use `UNIQUE KEY (job_name, scheduled_time)` + `ON CONFLICT DO NOTHING`.
    3. **Consumer (locking)**: Use `SELECT ... FOR UPDATE SKIP LOCKED` to ensure single worker execution.
  - **Status**: Documented as ADR-002 in `backend-architect.md`.

### 2025-12-20

- **Logger & Error Handling Implementation (Complete)**:
  - **LoggerService**:
    - Implemented smart logging: Switches between Pretty Print (Dev) and JSON (Prod) based on `AppConfig`.
    - Integrated with NestJS dependency injection (`ConsoleLogger` extension with `SCOPE.TRANSIENT`).
  - **GlobalExceptionFilter**:
    - Implemented standardized error handling using `@share/contract` `ApiResponse` type.
    - Registered via `APP_FILTER` in `ExceptionModule` to support dependency injection (LoggerService).
  - **Interceptors**:
    - **LoggingInterceptor**: Implemented request timing and system logging (Before/After logic) using RxJS `tap`.
    - **ResponseInterceptor**: Implemented standardized response wrapping using RxJS `map`.
    - **InterceptorModule**: Centralized registration of both interceptors using `APP_INTERCEPTOR` to ensure correct execution order (Logging -> Response).
  - **Integration**:
    - Registered `ExceptionModule` and `InterceptorModule` in `InfraModule`.
    - Configured `main.ts` to use `LoggerService` as the global application logger.
    - Verified architectural correctness (Module boundaries and DI patterns).
