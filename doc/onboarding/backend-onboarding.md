# Backend Onboarding Guide

後端採 NestJS + Drizzle，並以 capability packages 分離業務能力。

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
| `bun run check` | 全工作區型別與套件邊界檢查 |
| `bun run db:generate` | 根據各 capability schema 產生 migration |
| `bun run db:migrate` | 套用 migration |
| `bun run db:studio` | 啟動 Drizzle Studio |

## 邊界規則

- `apps/api` 是 HTTP 與資料庫 schema 的 composition root，不承載可重用業務邏輯。
- `packages/users`、`auth`、`access-control`、`assets`、`cms`、`mail`、`scheduling` 各自擁有服務、repository 與 schema。
- capability 不得匯入 `apps/api`；跨能力依賴必須透過公開 package export。
- `packages/database` 只提供連線與 repository 基礎能力，不知道任何業務 schema。
- Drizzle migration 只由 `apps/migrator` 管理，禁止建立第二套 migration authority。
- 共享 request/response 與 permission 型別放在 `@platform/contracts`。

完整說明見 [`../system-spec/architecture/capability-platform.md`](../system-spec/architecture/capability-platform.md)。

## 提交前

```bash
bun run lint
bun run check
bun run test
bun run build
```

若修改 schema，還要產生並檢查 migration；涉及登入或權限時，請在 PR 中列出額外的安全驗證。
