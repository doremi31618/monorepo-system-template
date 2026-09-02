# Capability Platform 架構

> **Work Item ID**: CAP-001
> **Project Task**: `doc/project-tasks/CAP-001-package-architecture.md`
> **Status**: Implemented
> **Last updated**: 2026-08-31

## 產品定位

本 repository 是 opinionated、NestJS-first、SvelteKit-first 的 full-stack monorepo template，不是 framework-neutral application framework。

- NestJS 10 是 server capability 的第一級 framework。
- Svelte 5／SvelteKit 2 是 Web 與共用 UI 的第一級 framework。
- Browser Fetch 是 client SDK 的 runtime interface。
- PostgreSQL／Drizzle 是資料存取與 migration authority。
- Bun 管理 workspace、安裝與 task orchestration；Node.js 執行正式 Nest API。

## App 與 Package

`apps/*` 是可部署 process 與 composition root；`packages/*` 是可重用 capability、framework adapter、型別或開發工具。

```text
apps/
├── api/          NestJS composition root、HTTP process 與唯一 migration history
├── web/          SvelteKit application
└── storybook/    Svelte UI 隔離開發與文件

packages/
├── nest/
│   ├── identity/{auth,users,access-control}
│   ├── content/{assets,cms}
│   └── infra/{database,logger,mail,scheduling}
├── types/{shared,identity,content}
├── browser/sdk
├── svelte/ui
└── testing/utils
```

Package name 使用 `(framework or role)-(major module)-(submodule)`：

```text
@platform/nest-identity-auth
@platform/nest-content-cms
@platform/nest-infra-database
@platform/types-identity
@platform/browser-sdk
@platform/svelte-ui
```

## Dependency Direction

以下 `A -> B` 表示 A 可以 import B：

```text
apps/web -> browser-sdk, svelte-ui, types-*
apps/storybook -> svelte-ui
apps/api -> nest-*, types-*

nest-identity-auth -> nest-identity-users
nest-identity-auth -> nest-infra-{database,logger,mail,scheduling}
nest-identity-auth -> types-{identity,shared}

nest-identity-access-control -> nest-identity-{auth,users}
nest-identity-access-control -> nest-infra-{database,logger}
nest-identity-access-control -> types-{identity,shared}

nest-content-assets -> nest-identity-users, types-{content,identity,shared}
nest-content-cms -> nest-content-assets, nest-identity-users, types-{content,identity,shared}

nest-infra-mail -> nest-infra-database
nest-infra-scheduling -> nest-infra-{database,logger}
nest-identity-users -> nest-infra-database, types-{identity,shared}
```

共同禁止規則：

- `packages/*` 不得 import `apps/*`。
- `types/*` 不得依賴 NestJS、Svelte、Drizzle 或其他 framework/runtime implementation。
- `browser/*` 與 `svelte/*` 不得依賴 `nest/*`。
- `nest/*` 不得依賴 `svelte/*` 或 `browser/*`。
- Capability 只能透過公開 package exports import 另一個 capability，不得跨 package deep import source。
- 不允許 circular dependency、unresolved import 或未宣告 dependency。

## Type 與 DTO Locality

Nest request／response DTO、`class-validator` decorator 與 HTTP validation implementation 位於擁有 endpoint 的 capability。

```ts
// @platform/nest-identity-auth
export class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
```

Framework-neutral type packages 只包含純 TypeScript interface、type、enum 或必要的 runtime constant：

- `types-shared`：response/error envelope、pagination、search 與跨大模組 primitive。
- `types-identity`：identity 大模組跨 package／跨 runtime 使用的資料形狀與 permission code。
- `types-content`：content 大模組跨 package／跨 runtime 使用的資料形狀。

Domain/repository input 不應因方便而直接重用 HTTP DTO。DTO 可以實作純 input interface，但 validation 與 transport 行為留在 Nest capability。

## Database Seam

Feature capability 擁有自己的 Drizzle table definitions。`nest-infra-database` 只提供 pool、database factory 與 repository primitive，不 import feature schema。

`apps/api/src/core/infra/db/schema.ts` 在 composition root 組合 runtime schema 與跨 capability relations，避免 `database -> feature -> database` cycle。

`apps/api/db/drizzle.config.ts` 掃描 `packages/nest/*/*/src/**/*.schema.ts`，並將 migration 寫入唯一的 `apps/api/db/migrations` history。Migration 與 API 共用同一個 PostgreSQL／Supabase schema composition，但保持獨立執行生命週期：部署流程先套用 migration，再啟動或滾動更新 API；API bootstrap 不自動修改 schema。

## Capability Composition

Capability package 不是自動發現的 plugin。使用 capability 必須明確：

1. 在 consumer `package.json` 宣告 `workspace:*`。
2. 在 Nest composition root import module。
3. 若擁有 schema，在 API schema composition 與 relations 組合它。
4. 提供並驗證必要 config／environment variables。
5. 產生與檢查 Drizzle migration。
6. 更新 build order、dependency graph 與文件。

完整操作流程由 `doc/onboarding/how-to-use-capability-package.md` 定義。

## Configuration Ownership

完整 process config 屬於 deployable app。`apps/api/src/config` 擁有 API env schema、port／URL composition，以及角色、權限與 Root Admin 等產品 bootstrap policy；`apps/web` 擁有公開的 Vite env contract。

Package 不得擁有或匯入 app-wide config。需要設定的 capability 只公開自己行為所需的窄介面：Mail、Auth、Assets、Logger 與 Scheduling 各自擁有設定切片；Access Control 接受由 composition root 注入的 bootstrap config。App 負責組合、驗證並提供這些設定，package 不得硬編碼 application credentials 或產品 policy。

## Package Interface

每個 package 必須透過 `package.json#exports` 與 `src/index.ts` 提供明確且最小的 interface，並在 README 記錄：

- 用途與非目標。
- Runtime、framework 與大模組分類。
- 公開 exports 與最小範例。
- 必要 dependencies、config、schema 與 migration。
- 允許／禁止的 dependency direction。
- 錯誤模式、安全注意事項與驗證命令。

## Dependency Health

Repository 必須提供：

```text
bun run deps:graph
bun run deps:check
bun run deps:graph:check
bun run deps:report
bun run deps:audit
```

- 專案內建檢查器從 workspace manifest 與實際 import 產生 graph，並檢查 naming、README/metadata、unlisted/unresolved、cycle、package→app 與 layer/framework constraints。
- Knip 報告 unused files／exports。
- Bun audit 檢查 high／critical vulnerability。
- CI 阻擋 architecture、manifest、相依圖過期與 high／critical security violations。
- 只有記錄在 [`security-audit-exceptions.md`](./security-audit-exceptions.md) 的單一 advisory 可暫時忽略，且必須有移除條件與複查日。
- Unused files／exports 第一版只作報告，不阻擋。

## OpenAPI 後續路徑

CAP-001 不導入 OpenAPI code generation。未來在出現第二 client、API/Web 分離發布或需對外 SDK 時，以獨立 Work Item 漸進執行：

1. 補齊 module-owned request／response DTO 與 Swagger metadata。
2. 使 OpenAPI schema 正確反映統一 response envelope。
3. 建立無 database seed、worker 或外部 I/O 副作用的 docs-only exporter。
4. 生成 OpenAPI artifact 與 Browser SDK types。
5. 以 compile-time equality tests 比對既有 types 與 generated types。
6. 逐 endpoint 將 Browser SDK 切換至 generated `paths`。
7. 移除已由 OpenAPI 取代的手寫 HTTP transport types，保留真正 domain types。

## Acceptance Constraints

- 重構不得改變既有 HTTP route、database schema 或 runtime response shape。
- 不建立第二套 migration history。
- 不建立舊 package compatibility layer。
- 所有 package rename 必須在同一 Work Item 更新 consumer、測試、設定、lockfile 與文件。
