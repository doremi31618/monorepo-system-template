# NestJS-first × SvelteKit-first Monorepo Template

這是一個有明確技術取向的全端專案模板：後端以 **NestJS 10** 為第一級 framework，前端以 **SvelteKit 2／Svelte 5** 為第一級 framework，搭配 Drizzle、PostgreSQL 與 Bun workspaces。它不是 framework-neutral framework，也不是自動發現插件的平台。

內建能力包含帳密與 Google 登入、Session/refresh、使用者與 RBAC、資產儲存、CMS、共用 Svelte UI、Storybook，以及唯一一套 Drizzle migration history。

## 專案結構

```text
apps/
├── api/          # NestJS composition root、HTTP API 與唯一 migration history
├── web/          # SvelteKit application
└── storybook/    # Svelte UI 隔離開發與文件

packages/
├── nest/
│   ├── identity/{auth,users,access-control}
│   ├── content/{assets,cms}
│   └── infra/{config,database,logger,mail,scheduling}
├── types/{shared,identity,content}  # 無 framework 的純型別
├── browser/sdk                     # Browser-only、UI framework-neutral
├── svelte/ui                       # Svelte-only UI
└── testing/utils                   # 測試工具
```

名稱直接表達使用邊界，例如 `@platform/nest-identity-auth`、`@platform/nest-content-cms`、`@platform/types-identity`、`@platform/browser-sdk`、`@platform/svelte-ui`。

## 開始開發

需要 Bun 1.3+、Node.js 22.12+；完整本機環境另需 Docker。

```bash
bun install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
bun run dev
```

- Web：`http://localhost:5173`
- API：`http://localhost:3333/v1`
- OpenAPI：`http://localhost:3333/openapi`
- Storybook：`bun run --filter @platform/storybook dev`

`bun run dev` 會先建置 packages，再同時啟動 NestJS watch mode 與 SvelteKit dev server。日常前端開發不需要等待 OpenAPI code generation；目前共享型別仍由 `types-*` 提供，未來遷移方式已寫入架構文件。

## 常用指令

```bash
bun run check             # 型別、package 邊界與相依圖一致性
bun run test
bun run build
bun run lint

bun run deps:graph        # 更新 Mermaid 套件相依圖
bun run deps:check        # cycles、漏宣告與跨層依賴（阻擋）
bun run deps:report       # unused files/exports（只報告）
bun run deps:audit        # high/critical vulnerability（阻擋）

bun run db:generate
bun run db:migrate
bun run db:studio
```

## 必守邊界

- `apps/*` 是 process 與 composition root；`packages/*` 不得反向依賴 app。
- NestJS DTO、Swagger metadata 與 `class-validator` 留在擁有 endpoint 的 `nest-*` 模組。
- `types-*` 只放跨 package/runtime 真的共用、且不依賴任何 framework 的純 TypeScript 型別。
- `browser-*`、`svelte-*` 與 `nest-*` 不可跨 runtime/framework 反向依賴。
- Feature package 擁有 schema；`apps/api/db/migrations` 是唯一 migration history。Migration 是獨立部署步驟，不會在 API 啟動時自動執行。
- 每個 package 必須有中文 README、明確 exports、`description` 與 `platform` metadata。

延伸閱讀：

- [整體架構與 OpenAPI 後續路徑](doc/system-spec/architecture/capability-platform.md)
- [套件相依圖](doc/system-spec/architecture/package-dependencies.md)
- [如何使用 capability package](doc/onboarding/how-to-use-capability-package.md)
- [如何建立 package](doc/onboarding/how-to-create-share-package.md)
- [如何新增共用 Svelte UI 元件](doc/onboarding/how-to-add-svelte-ui-component.md)
