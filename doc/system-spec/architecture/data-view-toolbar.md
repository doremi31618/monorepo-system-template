# 共用 Data View Toolbar 規格

> **Work Item**: CAP-001
> **Project Task**: `doc/project-tasks/CAP-001-package-architecture.md`
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
- 未選完 property、operator 或 value 的 draft 不得進入 committed query。
- 多欄位排序依畫面順序決定優先級，後端另加穩定 ID tie-breaker。
- URL 是可分享與可還原的 committed state；無效欄位、operator、value 或 direction 必須安全忽略。
- Search、Filter、Sort 變更時回到第一頁，後端在 pagination 前完成所有限制與排序。

## 4. 互動

### Search

- 非主要操作時維持緊湊，點擊後展開並 autofocus。
- 遠端搜尋 debounce 300ms；Enter 立即提交。
- 有文字時顯示 clear action；Escape 先清空，空白時再次 Escape 收合並將焦點還給 trigger。
- Placeholder 或 accessible description 說明實際可搜尋欄位。

### Filter

- Desktop 使用 Popover；窄螢幕使用有 Title 的 Sheet。
- Rule editor 依序選 Property、相容的 Operator、型別適合的 Value。
- 完整 rule 立即套用；active rules 在 toolbar 下方以可移除 chip 呈現。
- Clear filters 放在 editor 尾端，不放在 primary toolbar。

### Sort

- Desktop 使用 Popover；窄螢幕使用有 Title 的 Sheet。
- 每條 sort 顯示欄位、語意化方向與優先順序，可向前／向後調整及移除。
- 完整 sort rule 立即套用，trigger 顯示 active count。

### Accessibility 與 Responsive

- 所有 trigger 使用 button 語意，公開 `aria-expanded`／`aria-pressed` 與 accessible name。
- Overlay 關閉後恢復 trigger focus；list／select 支援標準鍵盤操作。
- Query 更新以 `aria-live="polite"` 提示結果狀態，不以顏色作為唯一狀態訊號。
- 小螢幕保留同一 query model；Search 保持一個動作可達，Filter／Sort editor 改用 Sheet。

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
- Search 的 debounce、Enter、Escape、clear 與 focus 行為符合本規格。
- Desktop Popover、mobile Sheet、鍵盤流程、focus restoration 與 ARIA state 可驗證。
- Loading、empty、no-results、invalid-query 與 error state 不破壞 toolbar state。
- Package check/build、Storybook component tests/build、Web check/build、API unit/E2E 與既有 regression tests 通過。
