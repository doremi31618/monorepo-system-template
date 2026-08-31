# overall Coding Standards & Guidelines

本文件旨在確保專案代碼的一致性與可維護性，所有開發者在新增功能或重構時應遵循此規範。

## 1. 專案開發流程 (Development Lifecycle)

標準開發流程如下，確保需求從釐清到上線的品質。

1.  **規格釐清 (Requirement Analysis)**
    *   **輸入**: PRD, User Story, 需求訪談。
    *   **產出**: 確認後的規格文件。
    *   **負責**: PM / Tech Lead。
2.  **UI/UX 設計 (Design)**
    *   **輸入**: 規格文件。
    *   **產出**: Figma Mockup, Prototype。
    *   **負責**: Designer。
3.  **系統分析設計 (SA/SD)**
    *   **輸入**: 規格, Mockup。
    *   **產出**: API Spec, DB Schema, Implementation Guide (技術實作指南)。
    *   **負責**: Backend / Tech Lead。
4.  **開發 (Development)**
    *   **輸入**: Implementation Guide, Mockup, API Spec。
    *   **產出**: 提交的程式碼 (PR)。
    *   **負責**: Frontend / Backend Engineer。
5.  **測試驗收 (QA/Verification)**
    *   **輸入**: 部署的環境 (Staging)。
    *   **產出**: 測試報告 (Test Report), Bug list。
    *   **負責**: QA / 交叉測試工程師。

---

## 2. 命名規範 (Naming Conventions)

### 通用原則
- **清晰優於簡短**: `calculateTotalPrice` 優於 `calc`。
- **英語優先**: 變數與函數名稱應使用英語，以保持國際化與一致性。

### 具體規則
- **變數與函數 (Methods & Variables)**: 使用 `camelCase`。
    - ✅ `createSession`, `isValid`, `userProfile`
    - ❌ `CreateSession`, `Is_Valid`, `UserProfile`
- **類別與介面 (Classes & Interfaces)**: 使用 `PascalCase`。
    - ✅ `AuthService`, `UserDto`, `ApiResponse`
- **常數 (Constants)**: 使用 `UPPER_SNAKE_CASE` (僅限於全域或靜態常數)。
    - ✅ `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`
- **檔案命名**: 使用 `kebab-case` 或 `camelCase` (視框架慣例，NestJS 推薦 kebab-case)。
    - ✅ `auth.service.ts`, `user-profile.component.ts`

## 3. 測試規範 (Testing)

- **單元測試 (Unit Tests)**: 核心業務邏輯 (Services, Utils) 必須有單元測試。
- **Mocking**: 測試時應 Mock 所有外部依賴 (DB, API)。

## 4. Git 版本控制規範 (Git Standards)

### 3.1 分支策略 (Branching Strategy)
我們採用 **Feature Branch Workflow**。

- **Main Branch**: `main`
    - 永遠保持可部署狀態 (Deployable)。
    - 禁止直接 Commit，必須透過 Pull Request (PR) 合併。
- **Development Branches**:
    - `feat/<name>`: 新功能 (e.g., `feat/user-auth`)
    - `fix/<issue>`: 錯誤修復 (e.g., `fix/login-error`)
    - `refactor/<scope>`: 重構 (e.g., `refactor/monorepo-structure`)
    - `docs/<scope>`: 文件修改 (e.g., `docs/api-guide`)
    - `chore/<scope>`: 工具/依賴更新 (e.g., `chore/update-deps`)

### 3.2 Commit Message 規範
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 標準。

**格式**: `<type>(<scope>): <subject>`

- **Types**:
    - `feat`: 新增功能 (Features)
    - `fix`: 修復 Bug (Bug Fixes)
    - `docs`: 文件變更 (Documentation)
    - `style`: 格式調整 (不影響程式碼運行)
    - `refactor`: 重構 (既非新增功能也不是修畢 Bug)
    - `test`: 增加或修改測試
    - `chore`: 建置過程或輔助工具的變更

**範例**:
- ✅ `feat(auth): implement google sso login`
- ✅ `fix(db): resolve connection timeout issue`
- ✅ `docs: update onboarding guide`

### 3.3 Pull Request (PR) 流程
1. **Title**: 清楚描述變更內容 (可同 Commit Message)。
2. **Description**: 說明 "Why" (為什麼要改) 與 "What" (改了什麼)。
3. **Checklist**:
    - [ ] 通過 CI (Lint/Test/Build)
    - [ ] 無多餘的 console.log 或 commented-out code
    - [ ] 若有 DB Schema 變更，已包含 Migration script
