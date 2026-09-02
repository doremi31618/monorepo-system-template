# 如何新增共用 Svelte UI 元件

本手冊說明如何將可重用的 Svelte 元件加入 `@platform/svelte-ui`，並讓 Web 與 Storybook 都能正確載入、套用 Tailwind theme 和完成互動驗證。

## 1. 先判斷元件應該放哪裡

符合以下條件時，元件才應放進 `packages/svelte/ui`：

- 不依賴特定 route、app store、API client 或環境變數。
- 能被兩個以上畫面或 Svelte app 重用。
- API 能以 props、snippet、event 或 bindable state 表達。
- 樣式使用共用 semantic tokens，例如 `bg-background`、`text-muted-foreground`。

只服務單一 Web feature 的元件應留在 `apps/web/src/lib/features`；route 專用元件則留在對應 route，不要為了共用少量 markup 提前搬進 UI package。

## 2. 現有解析流程

UI 元件的載入流程如下：

```text
packages/svelte/ui/src/lib/ui/<component>
                │ svelte-package
                ▼
packages/svelte/ui/dist/ui/<component>
                │ package.json exports
                ▼
@platform/svelte-ui/<component>
                │ workspace dependency
                ├── apps/web
                └── apps/storybook
```

- `packages/svelte/ui/package.json` 的 `./*` export 讓 consumer 能使用 `@platform/svelte-ui/<component>`。
- `apps/storybook/package.json` 以 `workspace:*` 宣告對 `@platform/svelte-ui` 的依賴。
- `apps/storybook/.storybook/main.ts` 尋找 `src/**/*.stories.svelte`，並啟用 Tailwind Vite plugin。
- `apps/storybook/.storybook/preview.ts` 載入 Web 的 `app.css`。
- `apps/web/src/app.css` 的 `@source` 會掃描 `packages/svelte/ui/src` 內的 Tailwind class。

Storybook 會自動尋找 story 檔，但不會把 package exports 自動轉成 stories。每個公開元件仍需建立 story。

## 3. 優先使用 shadcn-svelte CLI

專案的 `packages/svelte/ui/components.json` 已將元件目錄設為 `$lib/ui`，並共用 Web 的 Tailwind theme。新增官方 registry 元件時，請在 UI package 目錄執行：

```bash
cd packages/svelte/ui
bunx --bun shadcn-svelte@latest add avatar
```

也可以不指定名稱，開啟互動式清單：

```bash
bunx --bun shadcn-svelte@latest add
```

執行後必須檢查新增檔案、公開 exports、相依套件與 `git diff`。不要使用 `--overwrite` 覆蓋已客製化的元件，除非已確認現有修改可以被取代。

加入第三方 registry URL 後，也要檢查它產生的 import 是否符合本專案的 `$lib/ui`、`$lib/utils` alias。

## 4. 手動建立元件

需要自訂 primitive 時，在 UI package 建立一個元件目錄：

```text
packages/svelte/ui/src/lib/ui/avatar/
├── avatar.svelte
└── index.ts
```

單一元件的 `index.ts` 使用 named export：

```ts
import Root from './avatar.svelte';

export { Root, Root as Avatar };
```

Consumer 使用：

```svelte
<script lang="ts">
  import { Avatar } from '@platform/svelte-ui/avatar';
</script>

<Avatar />
```

Dialog、Select、Sidebar 等多部件元件，應在同一個 `index.ts` 匯出 `Root`、`Content`、`Trigger` 等組件，consumer 使用 namespace import：

```svelte
<script lang="ts">
  import * as Dialog from '@platform/svelte-ui/dialog';
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Example</Dialog.Title>
  </Dialog.Content>
</Dialog.Root>
```

不要直接匯入 `packages/svelte/ui/src`，也不要手動修改 `dist`；`dist` 必須由 `svelte-package` 產生。

## 5. 加入 Storybook

建議每個新元件建立獨立 story，例如：

```text
apps/storybook/src/stories/ui/Avatar.stories.svelte
```

基本範例：

```svelte
<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Avatar from '@platform/svelte-ui/avatar';

  const { Story } = defineMeta({
    title: 'UI Library/Avatar',
  });
</script>

<Story name="Default" asChild>
  <Avatar.Root>
    <Avatar.Fallback>EZ</Avatar.Fallback>
  </Avatar.Root>
</Story>
```

Story 至少應展示：

- 預設狀態與主要 variants。
- disabled、loading、empty 或 error 等有意義的邊界狀態。
- 鍵盤操作與 accessible name。
- 有 state 的元件使用 `play` 測試主要互動，而不是只確認可以 render。

## 6. 本機開發

UI package 的 exports 指向 `dist`，因此 Storybook 啟動前至少要建置一次 UI package：

```bash
bun run --filter @platform/svelte-ui build
bun run --filter @platform/storybook dev
```

需要持續修改 UI 元件時，建議使用兩個 Terminal。

Terminal 1：

```bash
cd packages/svelte/ui
bun run build --watch
```

Terminal 2：

```bash
bun run --filter @platform/storybook dev
```

Storybook 預設位於 `http://localhost:6006`。

## 7. Tailwind 與 theme 注意事項

- UI 元件使用 semantic token，不要寫死產品色彩。
- Tailwind class 必須以完整字串存在；避免 `bg-${color}-500` 這類無法靜態掃描的組合。
- Web 與 Storybook 目前共用 `apps/web/src/app.css` 的 theme；不要在 Storybook 另外維護第二份 tokens。
- 若 UI package 未來需要脫離 Web 獨立發布，應另開架構變更，將共用 theme 移到 UI package，再由 Web 與 Storybook 共同匯入。
- 元件新增的 runtime dependency 應宣告在 `packages/svelte/ui/package.json`，不可只加在 Storybook。

## 8. 驗證清單

新增或修改公開 UI 元件後執行：

```bash
bun run --filter @platform/svelte-ui build
bun run --filter @platform/svelte-ui check
bun run --filter @platform/storybook test
bun run --filter @platform/storybook build
bun run --filter @platform/web check
```

提交前再執行 repository-level checks：

```bash
bun run deps:check
bun run check
bun run test
bun run build
```

Review 時確認：

- [ ] 元件確實跨畫面可重用，沒有 app-specific dependency。
- [ ] `index.ts` 只公開穩定 API。
- [ ] Consumer 從 `@platform/svelte-ui/<component>` 匯入。
- [ ] Storybook 有範例與必要的互動測試。
- [ ] 元件有 accessible name，並可使用鍵盤操作。
- [ ] Web 與 Storybook 都能正確套用 theme。
- [ ] 沒有直接修改 generated `dist`。
- [ ] Build、check、component tests 與 repository regression 通過。

## 常見問題

### Storybook 顯示 `Failed to resolve @platform/svelte-ui/<component>`

先確認元件目錄有 `index.ts`，再重新建置 UI package：

```bash
bun run --filter @platform/svelte-ui build
```

同時檢查 Storybook 是否仍宣告 `@platform/svelte-ui: workspace:*`，不要用 Vite alias 繞過 package exports。

### 元件有 render，但 Tailwind 樣式不見了

確認 `apps/storybook/.storybook/preview.ts` 有載入 Web `app.css`，且 `apps/web/src/app.css` 的 `@source` 仍涵蓋 `packages/svelte/ui/src`。接著檢查 class 是否為 Tailwind 能靜態掃描的完整字串。

### 新元件為什麼沒有自動出現在 Storybook？

`main.ts` 只負責尋找 `*.stories.svelte`；它不會掃描 package exports 後自動產生展示頁。請為元件新增 story，或將它加入既有 UI Library catalog。
