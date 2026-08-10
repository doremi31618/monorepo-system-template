# Branch Contract

本文件定義分支的角色與最小合併規則。Actor 是人或 Agent 都適用相同規則。

## `feat/*`

**用途**：單一 Work Item 的規格、程式碼、測試與必要文件。

- Base：最新 `dev`。
- Owner：目前負責該 Work Item 的 Actor。
- 命名：`feat/<work-id>-<short-name>`。
- 禁止混入其他 Work Item 或直接合併其他未審核 feature branch。
- 透過 PR 合併到 `dev`，不可直接進入 `main`。
- 多 Actor 並行時，每個 branch 使用獨立 worktree。
- 同一個 branch 不得被多個 Actor 或 worktree 同時使用；建立與清理方式見 [worktrees.md](worktrees.md)。

**進入 `dev` 前**：規格與 Project Task 已更新、Acceptance Criteria 可驗證、必要測試通過、Review 完成。

## `dev`

**用途**：已審核功能的整合與完整測試環境。

- 不直接開發功能或提交臨時修正。
- 預設由主工作目錄 checkout `dev`，作為整合與驗證空間。
- 只接受已通過 Review 與必要 CI 的 `feat/*`，以及從 `main` 回同步的 hotfix。
- 由 Integrator 控制合併與衝突處理。
- 整合測試失敗時，優先回原 feature branch 修正；不要在 `dev` 就地修補而失去追蹤。

**進入 `main` 前**：預定發布範圍明確、完整驗證通過、release note 完成、Releaser 核准。

## `main`

**用途**：穩定且可發布的版本。

- 使用 branch protection，禁止直接 push 與 force push。
- 一般發布只接受 `dev` 的 release PR。
- 緊急修復只接受已審核的 `hotfix/*` PR。
- 每次合併必須可對應 release、PR、測試證據與 Project Task。

## `hotfix/*`

**用途**：處理已發布環境的緊急且範圍明確的問題。

- Base：最新 `main`。
- 命名：`hotfix/<work-id>-<short-name>`。
- 僅包含恢復服務或修正高風險缺陷所需的最小變更。
- 必須有針對性測試與 Review，再透過 PR 合併至 `main`。
- 發布後立即把相同修復同步至 `dev`，避免下次發布回歸。

## 共用保護規則

- `dev` 與 `main` 都應要求 PR、CI 與至少一個 Reviewer。
- Owner 不可成為同一變更的唯一 Reviewer。
- 禁止 force push 共用分支、跳過失敗檢查或以未記錄的手動修改取代正式修正。
- Merge conflict 必須由理解衝突兩側語意的 Integrator 處理，並重新執行受影響測試。
