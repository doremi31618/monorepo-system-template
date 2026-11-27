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
- `searchMode="persistent"` 保持搜尋欄常駐（含手機）。R7 版面：搜尋、Filter、Sort 與 `actions` 是**單一列、整組靠右**，任何寬度都不換行；桌面搜尋欄上限約 300px（空間不足時縮至 144px），多餘空間留在左側；手機搜尋欄填滿並可縮小，搜尋欄與 Filter／Sort 為 44px，並與 `actions` 同一列。`actions` 只由套件包一層 wrapper，內容屬於 consumer：手機上請自行提供至少 44×44px 的觸控目標（`NotionMoreMenu` 已是 `size-11`），且建議手機只放一個 More trigger，其餘指令（含批次操作入口）放進 More，避免單列擠壓搜尋欄。已套用的 filter chips 在下一列（桌面靠右）。預設 `toggle` 的開合行為、預設值與公開 props 不變；但上述共用版面套用到所有模式（例如 toggle 展開的桌面搜尋欄同樣上限 300px，chips 靠右）。這些版面只用 Tailwind 內建 utility，不需要 consumer theme。
- `actions` snippet 可放清單／卡片切換等 consumer action，不需 fork 共用 toolbar。

## Notion Table

`@platform/svelte-ui/notion-table` 是 controlled 的集合檢視：同一份 `NotionColumn[]` 定義同時驅動
desktop 語意 `<table>` 與手機卡片（`md` 以下純 CSS 重排）。Rows、column prefs、選取與列操作都由
consumer 持有；套件不含儲存、權限、API 或業務批次指令。

```svelte
<script lang="ts">
  import {
    NotionMoreMenu,
    NotionTable,
    emptyColumnPrefs,
    type ColumnPrefs,
    type NotionColumn,
  } from '@platform/svelte-ui/notion-table';

  const columns: NotionColumn[] = [
    { key: 'select', label: 'Select', utility: true },
    { key: 'name', label: 'Name', identity: true, mobile: 'title' },
    { key: 'status', label: 'Status', mobile: 'status' },
    { key: 'updated', label: 'Updated', mobile: 'footer' },
  ];
  let prefs = $state<ColumnPrefs>(emptyColumnPrefs());
</script>

<DataViewToolbar {properties} {query} searchMode="persistent" actions={more} onquerychange={…} />
{#snippet more()}<NotionMoreMenu {columns} bind:prefs dataCommands={[…]} />{/snippet}

<NotionTable {columns} {prefs} {rows} rowKey={(row) => row.id} ariaLabel="Documents">
  {#snippet cell(column, row)}
    {#if column.key === 'select'}
      <!-- 選取由 consumer 持有；以 44px label 包住 16px Checkbox 作為觸控目標。 -->
      <label class="flex size-11 cursor-pointer items-center justify-center md:-m-3.5">
        <Checkbox aria-label={`Select ${row.name}`} checked={selected.includes(row.id)} onCheckedChange={…} />
      </label>
    {:else}…{/if}
  {/snippet}
  {#snippet footer(row)}…{/snippet}  <!-- 手機卡片底部（列操作、長 ID）；desktop 不渲染 -->
</NotionTable>
```

- 選取、全選（`header` snippet）與批次指令都由 consumer 實作；套件不提供選取狀態。手機上請讓選取控制項
  的可點區域至少 44×44px（如上例的 label wrapper），不要只放 16px 的 `Checkbox`。
- 手機卡片（R7）：恰好一個 leading utility 欄（例如選取）且有 `mobile: 'title'` 欄時，選取放在卡片標題左側
  （邏輯方向 `start`，支援 RTL），標題與 status 讓出空間；有多個 leading utility 或沒有 title 欄時，維持 R6 的
  獨立頂列，不會重疊。不需要新 props；選取狀態與批次指令仍由 consumer 持有。
- 字級只使用 Tailwind 內建 `text-sm`／`text-xs`（手機值 14px、caption 12px、卡片標題 17px），不需要
  consumer theme 另外定義 token。

- `NotionColumn`：`key`（穩定 ID）、`label`、`identity`（永遠可見且置前）、`utility`／`trailing`
  （選取、列操作；固定、不列入顯示設定）、`locked`、`width`、`align`、`class`，以及手機角色
  `mobile: 'title' | 'status' | 'footer'`（未設定者為 label/value 列）。
- `NotionTable` props：`columns`、`prefs`、`rows`、`rowKey`、`cell` snippet、可選 `header`、`empty`、
  `detail`／`hasDetail`、`footer`、`ariaLabel`、`busy`、`rowClass`、`class`。
- Prefs helpers：`reconcileColumnPrefs`、`visibleColumns`、`configurableColumns`、`toggleColumn`、
  `moveColumn`、`emptyColumnPrefs`。未知／重複／格式錯誤的 prefs 會被修復，新欄位附加在尾端，
  locked／identity 欄位維持置前且可見；隱藏欄位（含 `footer` 角色）不會被繞過。
- `NotionMoreMenu`（Display／Data／Structure 分組，空群組不渲染）與 `ColumnDisplay`（桌面 Sheet、手機
  Drawer）。`NotionCommand`（`key`、`label`、`icon`、`disabled`、`onselect`）由 consumer 提供並自行做
  權限判斷；`labels` 可用 `NotionTableLabels` 覆寫（預設為英文 `defaultNotionTableLabels`）。
- 依賴：新增 `@platform/svelte-ui/checkbox`（bits-ui Checkbox primitive）；沒有新增 npm 依賴。`ColumnDisplay`
  使用 `$props.id()`，因此 peer dependency 為 `svelte ^5.20.0`。

### 來源 provenance

Promoted from Talent Pool `64f5a17`（docs `b7af0ac`，已合併於 TP Dev `dec05242`／PR 63）
`packages/ui/src/notion-table` 與 `checkbox`，只帶入泛用模組：import 改為本套件的 `$lib/…`，沿用 TP
既有的英文預設文字（`labels.ts` 未變更），註解移除 TP 用語，TP theme 專用的 `text-body`／`text-caption`
改為內建 `text-sm`／`text-xs`；未帶入 TP 頁面、匯出、API、fixtures 或品牌 CSS。Toolbar 只移植
R6／R7 響應式版面（手機常駐搜尋＋44px 控制項、整組靠右單列、300px 搜尋上限；TP `4c49510`，已合併 TP Dev `b68e94b`）。R7 的 NotionTable「選取在標題旁」也已移植，但加上條件（單一 leading utility＋title 欄）與 R6 fallback，並改用邏輯 `start`；此項取代先前「未移植」的紀錄。未帶入 TP 的 `leading` snippet、 TP 的 `query.ts`／`labels.ts` 變更。
