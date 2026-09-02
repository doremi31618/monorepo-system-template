# 如何建立 Workspace Package

先判斷內容是否真的需要成為 package。只被一個模組使用的 DTO、validator、repository helper 應留在該模組；只有需要跨 package 重用、且有清楚公開介面時才拆出來。

## 1. 選擇固定分類與名稱

| 類型 | 目錄 | 名稱格式 |
| --- | --- | --- |
| Nest 功能 | `packages/nest/<大模組>/<子模組>` | `@platform/nest-<大模組>-<子模組>` |
| 純型別 | `packages/types/<大模組>` | `@platform/types-<大模組>` |
| Browser 工具 | `packages/browser/<名稱>` | `@platform/browser-<名稱>` |
| Svelte UI | `packages/svelte/<名稱>` | `@platform/svelte-<名稱>` |
| 測試工具 | `packages/testing/<名稱>` | `@platform/test-<名稱>` |

不要建立語意模糊的 `contracts`、`common` 或看不出 framework 的功能名稱。

## 2. 建立完整 package interface

每個 package 必須同時具備：

- `README.md`：中文用途、runtime/framework、相依、註冊方式與最小範例。
- `package.json#description` 與 `package.json#platform`。
- `package.json#exports` 與最小化的 `src/index.ts`。
- `build` script 與對應 `tsconfig.json`。

Nest package 的 metadata 範例：

```json
{
  "name": "@platform/nest-billing-invoices",
  "description": "NestJS 的 Billing／Invoices 能力",
  "private": true,
  "platform": {
    "runtime": "node",
    "framework": "nestjs",
    "layer": "feature",
    "domain": "billing"
  }
}
```

內部相依一律明確宣告為 `workspace:*`。不可依賴 root hoisting，也不可 deep import 另一個 package 的 `src`。

## 3. 遵守型別與 DTO 邊界

- NestJS DTO、Swagger metadata、pipe 與 `class-validator` 留在 owning `nest-*` package。
- Domain/repository input 不直接重用 HTTP DTO；需要時定義純 interface，由 DTO `implements`。
- `types-*` 只能有純 TypeScript type/interface/必要常數，不得依賴 NestJS、Svelte、Drizzle 或驗證 framework。
- 只有多個模組或 runtime 真的共用的型別才可進 `types-*`。

## 4. 接上 workspace 與 composition

1. 確認根 `workspaces` glob 已涵蓋新分類。
2. 把 package 加到根 `build:packages` 的正確拓撲位置。
3. Consumer `package.json` 加上 `workspace:*`，並只從公開 export 匯入。
4. Nest capability 依[使用流程](./how-to-use-capability-package.md)註冊 module、schema、config 與 migration。
5. 產生 dependency graph 並提交更新。

## 5. 驗證

```bash
bun install
bun run --filter @platform/nest-billing-invoices build
bun run deps:graph
bun run deps:check
bun run check
bun run test
bun run build
```

`deps:check` 會阻擋命名/路徑不一致、缺 README/metadata、循環、漏宣告、package→app 與跨 runtime/framework 依賴。
