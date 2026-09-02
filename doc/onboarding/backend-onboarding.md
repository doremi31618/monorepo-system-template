# 後端 Onboarding：NestJS-first

後端採 NestJS 10 + Drizzle。`apps/api` 是 composition root；可重用能力依 `(framework)-(大模組)-(子模組)` 放在 `packages/nest`。

## 環境與啟動

- Node.js 22 LTS
- Bun 1.3+
- PostgreSQL；本機可執行 `docker compose up -d db`

```bash
bun install
cp apps/api/.env.example apps/api/.env
bun run dev:api
```

預設 API 位於 `http://localhost:3333`，OpenAPI 位於 `/openapi`。

## 常用指令

| 指令 | 用途 |
| --- | --- |
| `bun run dev:api` | 啟動 Nest watch mode |
| `bun run --filter @platform/api test` | API 與能力套件單元測試 |
| `bun run --filter @platform/api lint` | API 靜態規則檢查 |
| `bun run deps:check` | 循環、漏宣告、package→app、跨 framework/layer 檢查 |
| `bun run deps:graph` | 更新套件 Mermaid 相依圖 |
| `bun run check` | 執行相依規則、相依圖與全工作區型別檢查 |
| `bun run db:generate` | 根據各 capability schema 產生 migration |
| `bun run db:migrate` | 套用 migration |
| `bun run db:studio` | 啟動 Drizzle Studio |

## 邊界規則

- `apps/api` 是 HTTP 與資料庫 schema 的 composition root，不承載可重用業務邏輯。
- `packages/nest/identity/*`、`content/*`、`infra/*` 各自擁有 service、repository、DTO 與 schema。
- capability 不得匯入 `apps/api`；跨能力依賴必須透過公開 package export。
- `packages/nest/infra/database` 只提供連線與 repository 基礎能力，不知道任何業務 schema。
- Drizzle migration 只由 `apps/api/db` 管理，禁止建立第二套 migration history；部署時明確執行，API 啟動時不自動套用。
- Nest request/response DTO、Swagger decorator、`class-validator` 留在擁有 endpoint 的模組。
- `@platform/types-shared` 只放全域通用型別；Identity/Content 純型別分別放 `types-identity`／`types-content`，且不得依賴 NestJS。
- 新增 capability 必須更新 consumer dependency、Nest module composition、schema composition、migration、README、build order 與 dependency graph。

完整說明見 [`../system-spec/architecture/capability-platform.md`](../system-spec/architecture/capability-platform.md)。
實際註冊流程見 [`how-to-use-capability-package.md`](./how-to-use-capability-package.md)。

## 提交前

```bash
bun run lint
bun run check
bun run test
bun run build
```

若修改 schema，還要產生並檢查 migration；涉及登入或權限時，請在 PR 中列出額外的安全驗證。
