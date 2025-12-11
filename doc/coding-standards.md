# Coding Standards & Guidelines

本文件旨在確保專案代碼的一致性與可維護性，所有開發者在新增功能或重構時應遵循此規範。

## 1. 命名規範 (Naming Conventions)

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

## 2. 後端架構模式 (Backend Architecture Patterns)

### Service 與 Controller 的互動
- **Service 層**: 應專注於業務邏輯，並直接回傳 `DTO` 或純資料物件。
    - ❌ **避免**: 在 Service 中包裝 `{ data: ... }` 或 `{ statusCode: ... }`。
    - ✅ **正確**: 直接回傳 `UserDto`。
- **Response Handling**: 使用全域的 `ResponseInterceptor` 統一包裝 API 回傳格式。
    - Service 回傳 `T` -> Interceptor 包裝為 `ApiResponse<T>`。

### 錯誤處理 (Error Handling)
- 使用 NestJS 內建的 `HttpException` 或其子類（如 `BadRequestException`, `NotFoundException`）。
- **避免** 在 Service 層吞掉錯誤 (catch without throw)，除非有明確的 fallback 邏輯。

## 3. 前端開發規範 (Frontend Guidelines)

### 元件設計
- **Presentational vs Container**: 將邏輯與 UI 分離。
- **Props**: 為所有 Props 定義明確的型別。

### API 整合
- 使用共用的 `httpClient`，避免在元件中直接使用 `fetch`。
- 抽象化 Token 存儲邏輯，避免直接依賴 `localStorage` (方便測試)。

## 4. 測試規範 (Testing)

- **單元測試 (Unit Tests)**: 核心業務邏輯 (Services, Utils) 必須有單元測試。
- **Mocking**: 測試時應 Mock 所有外部依賴 (DB, API)。

## 5. 代碼提交與審查 (Commit & Review)

- **Commit Message**: 遵循 conventional commits (e.g., `feat: add user login`, `fix: resolve crash on startup`).
- **Review 重點**:
    - 是否有多餘的 `console.log`?
    - 是否有 Hard-coded 的魔法數字?
    - 是否遵循上述命名規範?
