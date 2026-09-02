# 前端 Onboarding：SvelteKit-first

前端採 SvelteKit 2 + Svelte 5 + Tailwind CSS 4。應用位於 `apps/web`，Svelte 專用共用元件位於 `packages/svelte/ui`，Storybook 位於 `apps/storybook`。

## 環境與啟動

- Node.js 22 LTS
- Bun 1.3+

```bash
bun install
cp apps/web/.env.example apps/web/.env
bun run dev:web
```

預設前端位於 `http://localhost:5173`。`apps/web/.env` 的 `VITE_API_BASE_URL` 必須包含 API global prefix，例如 `http://localhost:3333/v1`。所有 `VITE_*` 都會暴露到瀏覽器，不可放入 secret；修改後需要重新啟動 Vite。

## 常用指令

| 指令                                         | 用途                      |
| -------------------------------------------- | ------------------------- |
| `bun run dev:web`                            | 啟動 SvelteKit dev server |
| `bun run --filter @platform/web check`       | Svelte 與 TypeScript 檢查 |
| `bun run --filter @platform/web lint`        | Web 靜態規則檢查          |
| `bun run --filter @platform/web build`       | 建置 Web app              |
| `bun run --filter @platform/storybook dev`   | 啟動 Storybook            |
| `bun run --filter @platform/storybook build` | 建置 Storybook            |
| `bun run --filter @platform/svelte-ui check` | 驗證共用 UI 套件          |

## 邊界規則

- route 與 app-specific feature 留在 `apps/web/src`。
- 可重用 UI primitive 放在 `packages/svelte/ui`，並從 `@platform/svelte-ui/<component>` 匯入。
- 全域型別來自 `types-shared`；Identity/Content 型別分別來自 `types-identity`／`types-content`；HTTP client 來自 `browser-sdk`。
- Web/Svelte package 不得依賴 `nest-*`；`browser-sdk` 不得依賴 Svelte。
- 不要把 app store、route 或環境設定移進 UI 套件。
- 新增共用 UI 時，依照[新增共用 Svelte UI 元件手冊](./how-to-add-svelte-ui-component.md)同步補 package export、Storybook story 與互動測試；避免讓 Storybook 設定回流到 Web app。

## API 型別與開發模式

目前 `bun run dev:web` 直接使用 checked-in 的 `types-*`，不需要在每次 HMR 前執行 OpenAPI generation，因此後端暫停時仍可開發前端。修改 API response 時，必須在同一變更更新 module-owned DTO、對應純型別與 consumer；CI 會檢查 import/manifest 邊界。

未來導入 OpenAPI 時會提交可重現的 generated artifact，並提供 watch/export task；不會要求 runtime dev server 臨時向正在執行的 API 抓 schema。遷移前會先用 compile-time equality tests 防止手寫與生成型別分歧。

## 提交前

```bash
bun run lint
bun run check
bun run test
bun run build
```

目前 Web 的既有頁面仍有非阻擋式 Svelte 可及性警告；新增或修改畫面時不要增加警告數量。
