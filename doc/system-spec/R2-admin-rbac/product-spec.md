# Admin Panel 產品規格書 (Product Specification)

| 屬性 | 內容 |
| :--- | :--- |
| **專案名稱** | Admin Panel - Core System |
| **模組** | 使用者管理 (IAM) & 角色權限控制 (RBAC) |
| **版本** | v1.0 |
| **狀態** | Pending Approval |
| **負責人** | PjM / UIUX Designer |

> **Traceability**: `RBAC-001` updates role-deletion behavior and success feedback.

## 1. 產品概述 (Overview)
本系統旨在提供一個安全、靈活的後台管理介面，允許管理員管理內部使用者帳號，並透過基於角色的存取控制 (RBAC) 來細分不同模組的操作權限。核心目標是確保「對的人只能做對的事」。

## 2. 資訊架構 (Information Architecture)

### 2.1 權限階層 (Permission Hierarchy)
系統權限採用三層結構設計：
1.  **模組群組 (Module Group)**: 大功能分類 (例：文章管理系統、系統核心)。
2.  **子模組 (Sub-Module)**: 具體的實體資源 (例：文章、關鍵字、使用者)。
3.  **動作 (Actions)**: 針對資源的操作權限，標準化為 `View` (檢視/啟用), `Create`, `Update`, `Delete`。

### 2.2 網站地圖 (Sitemap)
*   **Dashboard** (首頁 - TBD)
*   **使用者管理 (User Management)**
    *   列表檢視
    *   新增/編輯使用者 (Modal)
*   **角色與權限 (Roles & Permissions)**
    *   角色列表 (Master View)
    *   權限矩陣設定 (Detail View)
    *   新增/編輯角色 (Modal)

## 3. 功能需求規格 (Functional Requirements)

### 3.1 導覽列與全域功能 (Navigation & Global)
*   **[REQ-G-01] RWD 側邊欄**:
    *   **Desktop**: 固定顯示於左側。
    *   **Mobile**: 預設隱藏，透過漢堡選單 (Hamburger Menu) 喚出，點擊背景或連結後自動收合。
*   **[REQ-G-02] 全域搜尋**: 位於 Header，支援搜尋使用者名稱、Email 或角色名稱。
*   **[REQ-G-03] 快速設定**: 提供切換語系、深色模式(預留)、登出功能。

### 3.2 使用者管理 (User Management)
*   **[REQ-U-01] 使用者列表**:
    *   顯示欄位：Avatar, 姓名, Email, 角色(Tag), 狀態(Active/Inactive), 最後登入時間, 操作。
    *   **分頁 (Pagination)**: 每頁顯示 5 筆，支援上一頁/下一頁/頁碼跳轉。
*   **[REQ-U-02] 篩選與搜尋**:
    *   支援關鍵字搜尋 (Name/Email)。
    *   支援依「角色」篩選。
    *   支援依「帳號狀態」篩選。
*   **[REQ-U-03] 新增/編輯使用者**:
    *   使用 Modal 呈現。
    *   必填欄位：姓名, Email, 角色。
    *   編輯時不可修改 Email (視為 Unique ID) 或需二次驗證 (本次 MVP 先允許修改)。
*   **[REQ-U-04] 帳號狀態切換**:
    *   列表上直接提供 Switch/Button 切換啟用或停用狀態。
*   **[REQ-U-05] 刪除帳號**:
    *   需跳出 Confirm Modal 二次確認。
    *   刪除為 Soft Delete (標記刪除) 或 Hard Delete 需由後端決定 (前端僅送出請求)。

### 3.3 角色與權限管理 (RBAC)
*   **[REQ-R-01] 角色列表 (Master View)**:
    *   顯示角色名稱、描述、成員數量。
    *   **[UX]** 目前選中的角色需有高亮樣式 (Active State)。
    *   **[UX]** 系統預設角色 (System Role) 需顯示鎖頭 Icon，且不可刪除。
*   **[REQ-R-02] 權限矩陣 (Detail View)**:
    *   右側顯示該角色的詳細設定。
    *   **基本資料**: 名稱與描述 (可編輯)。
    *   **權限表**: 依據 `Module Group` -> `Sub-Module` 分組顯示。
    *   **連動邏輯**:
        *   若勾選 Create, Update, Delete 任一項，系統強制自動勾選 View (Enable)。
        *   若取消 View，系統強制自動取消該列所有 CRUD 權限。
*   **[REQ-R-03] 新增/複製角色**:
    *   點擊「新增角色」跳出 Modal。
    *   包含基本資料輸入與「初始權限設定」(避免建立空權限角色)。
*   **[REQ-R-04] 刪除角色**:
    *   系統角色不可刪除；自訂角色需先顯示 Confirm Modal 二次確認。
    *   刪除自訂角色時，系統需在同一交易中解除使用者與權限關聯後刪除角色；使用者帳號必須保留。
    *   刪除請求與角色清單刷新皆成功後，顯示 `Role deleted successfully` 成功提示。
    *   刪除或清單刷新失敗時，不得顯示成功提示，並保留錯誤回饋。

## 4. UI/UX Mockup 設計說明 (Implementation Guide)
本節對應目前的 `AdminPanel.tsx` 程式碼，請開發者參照以下視覺定義：

### 4.1 色彩系統 (Color System)
使用 Tailwind CSS 標準色票：
*   **Primary**: `indigo-600` (用於按鈕、選中狀態、Icon)。
*   **Secondary/Background**: `slate-50` (背景), `white` (卡片)。
*   **Text**: `slate-900` (主要), `slate-500` (次要/描述)。
*   **Status**:
    *   **Success**: `green-500` (Create/Active).
    *   **Warning**: `amber-500` (System Role/Lock).
    *   **Danger**: `red-500` (Delete).
    *   **Info**: `blue-500` (Update).

### 4.2 組件庫定義 (Component Spec)
開發時請封裝以下共用元件 (如程式碼所示)：
*   `<Button />`: 支援 variant (primary, outline, ghost, destructive)。
*   `<Badge />`: 用於角色標籤與狀態顯示。
*   `<Modal />`: 統一的彈窗容器，包含 Header, Body, Footer。
*   `<Pagination />`: 獨立的分頁控制器。
*   `<PermissionMatrix />`: (核心) 複用於「新增角色 Modal」與「右側編輯面板」，確保權限設定介面一致。

### 4.3 互動狀態 (Interactive States)
*   **Loading**: 資料載入中需顯示 Skeleton 或 Spinner (System Spec 階段定義 API 狀態)。
*   **Dirty State**: 編輯角色權限或資料時，若有未儲存的變更，「儲存按鈕」應變色 (`indigo-600`) 提示使用者存檔。

## 5. 資料結構參考 (Data Schema Draft)
為了讓 Backend Developer 順利開發 API，定義以下 JSON 結構：

**Module Definition (Config)**
```json
[
  {
    "id": "article_system",
    "name": "文章管理系統",
    "modules": [
      { "id": "posts", "name": "文章管理" },
      { "id": "keywords", "name": "關鍵字管理" }
    ]
  }
]
```

**Role Object**
```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // true = 無法刪除
  permissions: {
    resource: string; // 對應 module id
    actions: ('view' | 'create' | 'update' | 'delete')[];
  }[];
}
```

## 6. 下一步 (Next Steps)
*   **System Designer**: 根據此 Spec 設計 Database Schema (User, Role, RolePermission table) 與 API Endpoints。
*   **Developer**: 根據 `AdminPanel.tsx` 進行 Component 拆分與實作 API 串接。
