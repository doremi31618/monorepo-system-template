# `@platform/svelte-ui`

Svelte 5 專用的 UI primitives。套件名稱明確標示 framework，不可由 NestJS 或 framework-neutral package 匯入。

- Runtime：Browser
- Framework：Svelte 5

```svelte
<script lang="ts">
  import { Button } from '@platform/svelte-ui/button';
</script>

<Button>儲存</Button>
```

新增元件後須從對應的 `src/lib/ui/<component>/index.ts` 匯出，並在 consuming app 的 Tailwind `@source` 指到本套件來源。
