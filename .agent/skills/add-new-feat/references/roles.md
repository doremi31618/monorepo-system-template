# Roles and Handoffs

Role 描述當下應執行的工作，不描述 Actor 是人或 Agent。同一 Actor 可在不同 Work Item 扮演不同角色，但 Owner 不可成為同一變更的唯一 Reviewer。

## Owner

負責把單一 Work Item 從需求推進到可審核狀態。

**工作**：

- 釐清目標、範圍、邊界與 Acceptance Criteria。
- 更新 Product/Technical Spec 與 Project Task。
- 從 `dev` 建立隔離的 `feat/*` branch 或 worktree。
- 實作、測試、提交並建立 PR。
- 提供測試證據、風險、已知問題與 Handoff。

**完成條件**：PR 可被獨立審核，且 Reviewer 不需要猜測需求或驗證方式。

## Reviewer

負責判斷變更是否符合需求並可安全進入整合環境。

**工作**：

- 對照 Acceptance Criteria、規格與實際行為。
- 檢查 Domain 邊界、可維護性、安全性、錯誤處理與回歸風險。
- 確認測試涵蓋核心邏輯與關鍵路徑，並檢查測試證據。
- 將必要修正與建議清楚分級；必要修正完成前不得核准。

**完成條件**：必要問題已解決，PR 有明確核准紀錄。

## Integrator

負責維持 `dev` 的可整合性，而不是替 Owner 完成功能。

**工作**：

- 確認 PR 已 Review、CI 通過且 Project Task 狀態正確。
- 評估與 `dev` 其他變更的相依性及衝突。
- 合併 PR，執行整合測試並記錄結果。
- 整合失敗時辨識責任 Work Item，交回對應 Owner 修正。

**完成條件**：功能已在 `dev` 通過整合驗證，Project Task 更新為 `Dev`。

## Releaser

負責決定已驗證的 `dev` 是否能成為穩定版本。

**工作**：

- 確認發布範圍、版本號、release note 與必要核准。
- 確認完整驗證結果、已知風險與 rollback 方式。
- 建立或核准 `dev -> main` PR，完成發布與版本標記流程。
- 發布後更新 Project Task、release note 與最終連結。

**完成條件**：`main` 可追蹤至已驗證的 release，且發布結果已記錄。

## 需要人工或明確決策的情況

無論目前 Actor 是誰，遇到以下情況都應停止自動推進並請求決策：

- Acceptance Criteria 不清楚或彼此衝突。
- 涉及產品方向、權限、敏感資料、不可逆資料遷移或重大架構變更。
- Merge conflict 無法只靠現有規格判斷正確行為。
- 測試失敗存在多種會改變產品行為的修正方案。
- 從 `dev` 推進到 `main` 的發布核准。
