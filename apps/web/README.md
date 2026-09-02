# Web app

這是本平台的 SvelteKit-first 前端應用。

- 可重用的 Svelte UI 元件來自 `@platform/svelte-ui`。
- API 共用 envelope 與分頁型別來自 `@platform/types-shared`。
- Identity 與 content 領域型別分別來自 `@platform/types-identity`、`@platform/types-content`。
- 瀏覽器端 API client 來自 `@platform/browser-sdk`。

請在 repository 根目錄執行：

```bash
bun install
cp apps/web/.env.example apps/web/.env
bun run dev:web
bun run --filter @platform/web check
bun run --filter @platform/web build
```

`VITE_API_BASE_URL` 是會暴露到瀏覽器的公開設定，必須包含 API global prefix，例如 `http://localhost:3333/v1`；密碼、資料庫網址與 private API key 不得使用 `VITE_*`。修改 `.env` 後需要重新啟動 Vite。Storybook 是位於 `apps/storybook` 的獨立應用。

新增 capability 或串接 API 前，請先閱讀 [`doc/onboarding/how-to-use-capability-package.md`](../../doc/onboarding/how-to-use-capability-package.md)，確認套件邊界與允許的相依方向。
