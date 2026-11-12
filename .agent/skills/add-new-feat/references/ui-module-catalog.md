# UI Module Catalog 維護規範

本 reference 定義跨專案的 UI module 治理方式與資料表格式。每個 repository 應在既有
`docs/` 架構中保存自己的 UI Module Catalog 與 UI Usage Audit；專案採用狀態不可只寫在
本 Skill 目錄，因為它必須與程式碼一起 Review、commit 及版本化。

## 核心規則

- 相同使用情境必須使用相同的標準 module。
- 不把所有搜尋、選擇與篩選行為塞入一個巨大 module；以使用情境區分 interface。
- 頁面負責業務欄位、資料來源與 query adapter；共用 module 負責既定 UX、響應式與可及性。
- 既有 module 無法滿足需求時，先評估擴充 interface；只有使用情境實質不同時才新增 module。
- 純粹因為版面不同、開發較快或只用一次，不構成複製 module 的理由。
- 跨 App 通用的修正應進入共用 Vendor／package 的權威來源，再依專案既有機制更新固定版本。

## 資料表一：UI Module Catalog

每列代表一個核准的使用情境與標準 interface。

| 欄位 | 用途 |
| --- | --- |
| ID | 穩定識別碼，例如 `DIR-001`、`SELECT-001` |
| 使用情境 | 使用者正在完成的任務，不以畫面名稱命名 |
| 標準 module | 必須使用的公開 interface |
| 所屬層級 | Vendor、App adapter、App domain 或待決定 |
| 使用規則 | caller 必須知道的必要條件與不變量 |
| 禁止做法 | 會造成 UX 或實作分叉的替代做法 |
| 響應式／可及性 | 桌面、手機、鍵盤與 screen reader 要求 |
| 必要驗證 | module interface 與 consumer 必須具備的測試 |
| 狀態 | 草稿、標準、內部標準、待統一、淘汰中、已淘汰 |
| Owner／來源版本 | 維護者、package 或固定 snapshot 版本 |

初始規則：

| ID | 使用情境 | 標準 module | 所屬層級 | 使用規則 | 禁止做法 | 必要驗證 | 狀態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DIR-001 | 清單頁搜尋、篩選、排序 | `DirectorySearchToolbar` 或專案核准的同等 adapter | App adapter | 所有 directory 頁由 properties 與 controlled query 驅動 | 自行組合 Input、Select、Checkbox 作為清單篩選器 | 搜尋 debounce、Confirm、chips、桌面 Popover、手機 Drawer | 標準 |
| FILTER-001 | 結構化篩選互動 | Vendor `DataViewToolbar` | Vendor | 由 App adapter 包裝，頁面只提供欄位與 query | 功能頁 fork 或直接修改 Vendor implementation | draft/commit、移除、清除、async options、排序 | 內部標準 |
| SELECT-001 | Provider、Offering 等搜尋多選 | Vendor `SearchableMultiSelect` | Vendor | 使用靜態 options 或 abortable cursor loader | 自製搜尋框、checkbox 清單與載入更多 | 搜尋、已選值、續載、重試、手機 Drawer | 標準 |
| PAGING-001 | Cursor 長清單自動續載 | Vendor `AutoLoadSentinel` | Vendor | consumer 提供 hasMore、loading、error 與 loader | 每頁自行建立 IntersectionObserver | 成功、錯誤重試、游標未前進、全部載入 | 標準 |
| FORM-001 | 一般單行文字、數字、日期輸入 | 專案指定的統一 `Input` | 待決定 | 同一專案只保留一個權威來源 | 原生 input 加頁面專屬樣式 | label、錯誤、disabled、focus-visible | 待統一 |
| FORM-002 | 少量固定選項表單 | 專案指定的 `Select`／`NativeSelect` | App UI | 僅用於表單資料輸入 | 以獨立 Select 取代 directory filter | 鍵盤、label、disabled、錯誤狀態 | 標準 |
| BUTTON-001 | 一般操作 | 專案指定的統一 `Button` | 待決定 | 新增、儲存、取消、重新整理使用核准 variant | 原生 button 加頁面專屬樣式 | loading、disabled、focus、圖示間距 | 待統一 |
| ADAPTER-001 | UI query 與後端參數轉換 | Page query adapter | App domain | 業務 predicate、預設值與 URL mapping 留在 App | 將產品 API 或資料表知識放入 Vendor | round-trip、預設值、非法值、分頁重置 | 標準 |
| SCHEMA-001 | 動態／自訂欄位產生篩選欄位 | Entity filter schema adapter | App domain | 使用穩定 field ID 產生 property | 各實體重做一套 filter UI | 改名、刪除、選項更新與 schema 版本變更 | 規劃中 |

專案可以增加列或把「專案指定」替換成實際 module 名稱，但不得無證據地刪除既有規則。

## 資料表二：UI Usage Audit

每列代表一個實際頁面或互動表面對標準 module 的採用狀態。

| 欄位 | 用途 |
| --- | --- |
| 頁面／功能 | 實際 route、dialog 或 editor |
| 使用情境 | 對應 catalog 的任務描述 |
| Catalog ID | 關聯 UI Module Catalog |
| 應使用 module | 規範要求 |
| 目前實作 | 實際 module 或自製實作 |
| 符合狀態 | 符合、部分符合、待收斂、核准例外、尚未盤點 |
| 差異／例外理由 | interface 或 UX 的具體差異 |
| 驗證位置 | component、integration、E2E 或視覺測試 |
| Work Item／Owner | 負責收斂或核准例外的人與追蹤項目 |
| 最後檢查版本 | commit、release 或日期 |

## 每個 Work Item 的維護判定

完成實作與驗證後逐項檢查：

1. 是否新增或移除使用者可見的搜尋、篩選、排序、選擇、分頁、表單或 overlay？
2. 是否改變既有 module 的 interface、預設值、文案、尺寸、狀態或響應式行為？
3. 是否新增頁面、dialog 或 editor，需要登錄 Usage Audit？
4. 是否直接使用原生 input、select、button，或建立與標準 module 重疊的 local implementation？
5. 是否新增經核准的例外、淘汰舊 module，或完成一項收斂？
6. 是否改變必要測試、accessibility 或視覺基準？
7. 是否改變跨專案的共用規則，需要更新本 reference？

任一答案為「是」時，更新 repository 的 catalog／usage audit 並與程式碼一同 Review。
全部為「否」時，在 Project Task 留下：

```text
UI Module Catalog: reviewed — no change
Reason: <本次 Work Item 為何不影響 UI module 或既定 UX>
```

只寫「N/A」不算完成；必須留下可判斷的理由。

## Review Gate

Reviewer 應確認：

- 同一使用情境沒有新增第二套 module。
- consumer 只跨公開 interface，不依賴 implementation 細節。
- 頁面專屬業務轉換留在 App adapter，不滲入 Vendor。
- 新增例外有原因、Owner、移除或重新評估條件。
- catalog、usage audit、規格與測試反映同一個實際行為。

檢查未完成時，Work Item 不得從實作階段進入 Review。
