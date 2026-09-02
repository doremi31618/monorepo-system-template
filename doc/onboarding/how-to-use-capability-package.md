# 如何使用 Capability Package

本專案口語上可能把共用能力稱為「插件」，但它們不是 runtime 自動發現的 plugin。每個 capability 都是一般 Bun workspace package，必須由 composition root 明確安裝、註冊與設定；這讓依賴可追蹤、型別可檢查，也避免啟動時的隱性行為。

以下以 `@platform/nest-content-cms` 為例。

## 1. 宣告 workspace dependency

在 consumer（通常是 `apps/api`）的 `package.json` 加入：

```json
{
  "dependencies": {
    "@platform/nest-content-cms": "workspace:*"
  }
}
```

執行 `bun install` 更新 lockfile。不要用 TypeScript path alias 或直接匯入另一套件的 `src`。

## 2. 註冊 Nest module

把功能模組放進 `apps/api/src/core/domain/domain.module.ts`；infra capability 則放 `infra.module.ts`。

```ts
import { Module } from '@nestjs/common';
import { CmsModule } from '@platform/nest-content-cms';

@Module({
  imports: [CmsModule],
  exports: [CmsModule],
})
export class DomainModule {}
```

Module registration 只負責 Nest dependency injection；它不會自動完成資料庫 schema、設定或 migration。

## 3. 組合資料庫 schema

若 package export `./schema`，在 `apps/api/src/core/infra/db/schema.ts` 合併它：

```ts
import * as cmsModel from '@platform/nest-content-cms/schema';

export const schema = {
  ...cmsModel,
  // 其他 capability schema 與 app-owned relations
};
```

跨 capability relation 留在 composition root，避免 feature packages 互相建立循環。`nest-infra-database` 不得知道任何 feature schema。

## 4. 提供設定與外部資源

- 在 owning package README 列出必要環境變數、provider token 與 peer dependency。
- 在 `apps/api` 的 Config/Infra composition 提供實際值。
- 啟動時驗證必要環境變數；不可把 secret 或環境特定值寫死在 package。
- 需要 queue、mail、storage 等外部 I/O 時，測試必須能以 adapter/mock 隔離。

## 5. 產生 migration

Feature package 擁有 table definition，但 migration history 永遠只有 `apps/api/db/migrations`：

```bash
bun run db:generate
bun run db:migrate
```

檢查產生的 SQL，不要在 feature package 建立第二份 migration 目錄。Migration 是部署前的一次性步驟，不應放進 API bootstrap。

## 6. 接上前端

- 純 Identity/Content 資料形狀分別從 `@platform/types-identity`、`@platform/types-content` 匯入。
- 全域 API envelope、分頁與搜尋使用 `@platform/types-shared`。
- HTTP 使用 `@platform/browser-sdk`；Svelte component 使用 `@platform/svelte-ui/<component>`。
- Web/Svelte/browser package 不得匯入任何 `nest-*` package。

Nest request DTO、Swagger decorator 與 `class-validator` 不共享到前端；它們留在 endpoint 的 owning module。若前後端需要同一純資料形狀，Nest DTO 可以 `implements` framework-neutral interface。

## 7. 開發與 OpenAPI

目前本機 runtime dev 不依賴 OpenAPI generation：`bun run dev` 先建置 checked-in packages，之後 NestJS 與 SvelteKit 各自 watch。這使前端在 API 尚未啟動時仍能工作，但 API 變更必須在同一 PR 更新 DTO、純型別與 consumer。

未來 OpenAPI 流程會以獨立 Work Item 導入：

1. owning module 補齊 request/response DTO 與 Swagger metadata。
2. docs-only exporter 在無 DB seed、worker、mail 或 storage 副作用下輸出固定 OpenAPI artifact。
3. generator 從 artifact 產生 Browser SDK transport types，並提交或在安裝/建置時可重現產生。
4. dev watch 只監看 DTO/schema 重新產生，不要求前端在 runtime 向 live API 抓 schema。
5. 遷移期以 compile-time equality test 比對手寫與 generated type。
6. 逐 endpoint 切換後，才刪除被取代的手寫 HTTP transport types；真正 domain types繼續保留。

## 8. 提交前檢查

```bash
bun run deps:graph
bun run deps:check
bun run deps:report
bun run check
bun run test
bun run build
```

`deps:report` 的 unused files/exports 目前只供判讀；其餘循環、漏宣告、跨層、相依圖過期與 high/critical vulnerability 會在 CI 阻擋。
