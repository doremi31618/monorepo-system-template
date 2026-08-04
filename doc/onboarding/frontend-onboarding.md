# Frontend Onboarding Guide

前端採 SvelteKit 5 + Tailwind CSS 4。應用位於 `apps/web`，共用元件位於 `packages/ui`，Storybook 位於獨立的 `apps/storybook`。

## 環境與啟動

- Node.js 22 LTS
- Bun 1.3+

```bash
bun install
bun run dev:web
```

預設前端位於 `http://localhost:5173`。若 API 不在預設網址，請在 `apps/web/.env` 設定 `VITE_API_BASE_URL`。

## 常用指令

| 指令 | 用途 |
| --- | --- |
| `bun run dev:web` | 啟動 SvelteKit dev server |
| `bun run --filter @platform/web check` | Svelte 與 TypeScript 檢查 |
| `bun run --filter @platform/web lint` | Web 靜態規則檢查 |
| `bun run --filter @platform/web build` | 建置 Web app |
| `bun run --filter @platform/storybook dev` | 啟動 Storybook |
| `bun run --filter @platform/storybook build` | 建置 Storybook |
| `bun run --filter @platform/ui check` | 驗證共用 UI 套件 |

## 邊界規則

- route 與 app-specific feature 留在 `apps/web/src`。
- 可重用 UI primitive 放在 `packages/ui`，並從 `@platform/ui/<component>` 匯入。
- API 型別與 permission 常數來自 `@platform/contracts`；HTTP client 來自 `@platform/sdk`。
- 不要把 app store、route 或環境設定移進 UI 套件。
- 新增共用 UI 時，同步補 Storybook story；避免讓 Storybook 設定回流到 Web app。

## 提交前

```bash
bun run lint
bun run check
bun run test
bun run build
```

目前 Web 的既有頁面仍有非阻擋式 Svelte 可及性警告；新增或修改畫面時不要增加警告數量。
