# @platform/ui

**Framework：Svelte 5**

可重用的低階 UI primitives，使用 Bits UI 與 Tailwind-compatible utilities。產品 route 與 domain workflow 不應放在此 package。

```svelte
<script lang="ts">
  import { Button } from '@platform/ui/button';
</script>
```

以 `bun run --filter @platform/ui check` 與 `bun run --filter @platform/ui build` 驗證。
