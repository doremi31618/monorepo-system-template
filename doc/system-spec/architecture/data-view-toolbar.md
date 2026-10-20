# 共用 Data View Toolbar 規格

> **Work Items**: CAP-001, SUI-001, M4-04
> **Project Tasks**: `doc/project-tasks/CAP-001-package-architecture.md`,
> `doc/project-tasks/SUI-001-notion-filter-builder.md`,
> `doc/project-tasks/M4-04-filter-operators.md`
> **Status**: Approved for implementation
> **Approved at**: 2026-09-02

## 1. 目的

Admin 的資料清單應使用一套可重用、Notion-like 的漸進式查詢工具列。Notion-like 指互動語法，不代表複製 Notion 的品牌外觀；顏色、字型、間距、圖標與 focus state 必須沿用本專案的 semantic tokens、Tailwind 與 Lucide。

## 2. Package 邊界

`@platform/svelte-ui/data-view-toolbar` 擁有：

- Search、Filter、Sort 的共用互動與版面。
- Filter rule、Sort rule、property definition 與 query state 的型別。
- 完整 rule 的驗證、active summary、鍵盤操作及 responsive overlay。
- Query state 的通用序列化與安全解析規則。

App consumer 擁有：

- Users、Roles、CMS、Assets 等領域欄位與 option 定義。
- SvelteKit URL 導航、API request、loading、result 與 error state。
- 後端欄位白名單、資料庫 predicate、排序 expression 與穩定 tie-breaker。

UI package 不得匯入 app route、領域 API、NestJS package 或資料庫 schema。

## 3. 查詢模型

```text
DataViewQuery
├── search: string
├── filters: FilterRule[]
│   └── property → operator → value
└── sorts: SortRule[]
    └── property → direction
```

- Search、Filter、Sort 保持不同語意，但共用同一份 committed query state。
- Filter 第一版只支援多條 `AND`；不支援巢狀 group 或 `OR`。
- Enum／relation 欄位可提供 `is`、`is not` 與 `is any of`；日期提供 before／after／between；完整 operator 由 property definition 限制。
- 一個 property 最多有一條 rule；再次選取既有 property 時進入編輯。不同 property 的
  rules 使用 AND，同一個多選 rule 的 values 使用 OR。
- 未選完 property、operator 或 value 的 draft 不得進入 committed query；SUI-001 要求
  使用者按下 Confirm 後才提交完整 rule，直接關閉 overlay 必須捨棄草稿。
- 多欄位排序依畫面順序決定優先級，後端另加穩定 ID tie-breaker。

### 3.1 Opt-in operator 與重複 rule（M4-04）

- Operator 型別可擴充；package 不認得任何業務型別或 operator 名稱。Property 可用 `operatorMeta` 宣告每個 operator 的 operand（`none`／`single`／`multi`）與選填 label；未宣告者維持內建行為。
- `none`（unary）不顯示 value editor，可直接 Confirm，value 為 `''`，且不呼叫 `loadOptions`；`multi` 允許多選。自訂 `filterEditors` 由 context 的 `operand` 得知 operand 種類，`multi` 以 `selectedValues` 判斷 Confirm 與提交值；非選項型 property 若無自訂 editor 則無法提交 `multi`。
- Property 設 `allowRepeat`（可選 `maxRules`）後，同一 property 可有多條 rule；rule 以選填的穩定 `id` 區分，可各自編輯、移除，且不會自動取代同欄位既有 rule。未啟用者仍是一個 property 一條 rule。
- Property 可選 `normalizeText(raw)`：單值文字 operand（內建 input 或自訂 editor）的 Confirm 驗證與提交值都使用其結果，結果為空字串即視為空白；未提供時維持 `trim()`。`between` 一律 trim。Package 不內建任何業務空白規則，由 consumer 提供。
- Rule identity：先比對物件參考，其次只認同 property 內唯一的 `id`；`id` 以 property 為範圍。無 `id`、找不到或有歧義（同 property 重複 `id`）時編輯與移除皆不變更 query，也不 append。Parse 對 `allowRepeat` 缺少或重複的 `id` 指派可重現的 `<property>-<n>`；toolbar 新 rule 取目前 query 所有 rule（不限 property）皆未使用的最小 `<property>-<n>`。編輯任何 property 的 rule 都保留其既有 `id`，只有新的重複 rule 會產生 `id`。無 `id` 的 chip 以 property 內出現次序為 key，非重複 property 編輯後移到末端仍是同一個 chip、focus 不變。父層以無 `id` 的新物件重建 query 時，進行中的編輯不會套用——跨重建保持身分須使用穩定 `id`。
- Overlay 關閉以 `onCloseAutoFocus` 將 focus 交回 Add filter／Sort 按鈕或開啟編輯的 chip；編輯中跨越 mobile breakpoint 時 Popover／Drawer 互換但不視為關閉，草稿保留。`searchMode='persistent'` 在 mobile 以 toggle 呈現，空白時 Escape 可收合；desktop 維持常駐。
- 草稿規則不變：只有 Confirm 才提交，Cancel／Escape／關閉捨棄。
- Package 不自動持久化；URL codec 仍供舊 caller，`writeDataViewQuery` 可傳入 properties 以寫出 unary rule。Codec 的單值字串是否空白也依該 property 的 `normalizeText`（未提供時 `trim()`）判斷，寫出與 parse 皆保留原值。
- URL 是可分享與可還原的 committed state；無效欄位、operator、value 或 direction 必須安全忽略。
- Search、Filter、Sort 變更時回到第一頁，後端在 pagination 前完成所有限制與排序。

## 4. 互動

### Search

- 支援 `toggle` 與 `persistent`；Admin 預設維持緊湊，Databricks directory consumer 使用常駐
  搜尋欄。
- 遠端搜尋 debounce 300ms；Enter 立即提交。
- 有文字時顯示 clear action；Escape 先清空，空白時再次 Escape 收合並將焦點還給 trigger。
- Placeholder 或 accessible description 說明實際可搜尋欄位。

### Filter

- Desktop 使用 Popover；窄螢幕使用有 Title、Description 與固定 action footer 的 bottom
  Drawer，並支援下滑關閉。
- Rule editor 依序選 Property、相容的 Operator、型別適合的 Value。
- text、enum、relation、number、date、boolean 使用各自適合的 value editor。新的 datatype
  可由明確的 custom editor contract 擴充，不得把 app API 放進 UI package。
- enum／relation 可使用靜態 options，或由 consumer 注入
  `loadOptions({ search, cursor, signal })`；UI 負責 loading、error、empty、取消舊請求與
  cursor 分頁，consumer 負責資料來源。
- Confirm 套用一條完整 rule；active rules 在 toolbar 下方以可編輯、可移除 chip 呈現，
  並提供 Add Filter 與 Clear All。

### Sort

- Desktop 使用 Popover；窄螢幕使用有 Title 與 Description 的 bottom Drawer。
- 每條 sort 顯示欄位、語意化方向與優先順序，可向前／向後調整及移除。
- 完整 sort rule 立即套用，trigger 顯示 active count。

### Accessibility 與 Responsive

- 所有 trigger 使用 button 語意，公開 `aria-expanded`／`aria-pressed` 與 accessible name。
- Overlay 關閉後恢復 trigger focus；list／select 支援標準鍵盤操作。
- Query 更新以 `aria-live="polite"` 提示結果狀態，不以顏色作為唯一狀態訊號。
- 小螢幕保留同一 query model；Search 保持一個動作可達，Filter editor 改用 bottom Drawer。

## 5. Admin 欄位矩陣

| 頁面      | Search                   | Filter                         | Sort                                                |
| --------- | ------------------------ | ------------------------------ | --------------------------------------------------- |
| Users     | name、email              | role                           | name、email、createdAt                              |
| Roles     | name、description        | isSystem                       | name、createdAt                                     |
| CMS Posts | title、slug              | status、tagId、updatedAt       | updatedAt、createdAt、publishedAt、title、viewCount |
| Assets    | originalName、storageKey | status、mimePrefix、visibility | createdAt、updatedAt、originalName、size            |

## 6. Scope

### In scope

- `@platform/svelte-ui` 共用元件、型別、query codec 與 Storybook stories。
- `/admin/users`、`/admin/roles`、`/admin/cms` 的 Posts collection、`/admin/assets` consumer migration。
- 必要的 API query contract、輸入白名單、server-side filters、ordered multi-sort 與 pagination。

### Out of scope

- Saved Views、view tabs、欄位顯示設定。
- 巢狀條件與 `OR` group。
- CMS editor 的 Tag lookup、Asset Picker 或其他局部搜尋。
- 直接複製參考產品的品牌外觀。

## 7. Acceptance Criteria

- 四個頂層 Admin collection 使用同一個 package toolbar，並只宣告自己的欄位設定。
- URL 可重現 Search、Filter、Sort 與 page；重新整理與返回 collection 不遺失 committed state。
- API 在 pagination 前套用所有條件，multi-sort 順序正確且結果穩定。
- Incomplete draft 不觸發查詢；active rule／sort count 與 chip 可見且可單獨移除。
- Filter rule 只有 Confirm 才提交；關閉未完成或未確認的 editor 不改變 committed query。
- 六種 built-in datatype editor 與 async option provider 的 loading／error／pagination contract
  均有可執行測試。
- Search 的 debounce、Enter、Escape、clear 與 focus 行為符合本規格。
- Desktop Popover、mobile bottom Drawer、鍵盤流程、focus restoration 與 ARIA state 可驗證。
- Loading、empty、no-results、invalid-query 與 error state 不破壞 toolbar state。
- Package check/build、Storybook component tests/build、Web check/build、API unit/E2E 與既有 regression tests 通過。
