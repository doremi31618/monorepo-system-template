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

## Data View Toolbar

`DataViewToolbar` 是 controlled component。consumer 宣告欄位、保存 committed query，並把
query 轉成 API request；元件不認識任何產品 API。

```svelte
<script lang="ts">
  import {
    DataViewToolbar,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';

  const properties: DataViewProperty[] = [
    {
      key: 'provider',
      label: '供應商',
      type: 'relation',
      operators: ['is', 'isAnyOf'],
      loadOptions: ({ search, cursor, signal }) =>
        api.listProviders({ search, cursor, signal }),
    },
  ];
  let query: DataViewQuery = $state({ search: '', filters: [], sorts: [] });
</script>

<DataViewToolbar
  {properties}
  {query}
  searchMode="persistent"
  labels={{ addFilter: '新增篩選', search: '搜尋資料' }}
  onquerychange={(next) => (query = next)}
/>
```

- 內建 datatype：`text`、`enum`、`relation`、`number`、`date`、`boolean`。
- `enum`／`relation` 可用靜態 `options`，或實作 abortable cursor loader。UI 負責載入、錯誤、
  空狀態與向下捲動續載。
- 新 datatype 可透過 `filterEditors` 傳入 typed Svelte snippet；snippet 只更新 draft，仍由
  `Confirm filter` 統一提交。
- 窄螢幕的 Filter 與 Sort 使用 bottom Drawer；桌面使用 Popover。
- `searchMode="persistent"` 保持搜尋欄常駐；預設 `toggle` 保留原本的緊湊工具列。
