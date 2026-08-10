# Delivery Workflows

## Feature Delivery

```text
Project Task
  -> Spec
  -> feat/* branch or worktree
  -> Implementation and tests
  -> Review
  -> dev integration
  -> Project Task: Dev
```

1. Owner 在 `docs/project-tasks/` 建立或更新 Work Item，指派唯一且穩定的 Work Item ID。
2. Owner 更新 `docs/system-spec/` 內的必要規格，並在 Task 與 Spec 之間建立含 Work Item ID 的雙向連結。
3. Owner 從最新 `dev` 建立 `feat/*` branch；並行工作使用獨立 worktree。
4. Owner 實作、測試並開啟 `feat/* -> dev` PR；相關 commit 與 PR 都必須包含 Work Item ID。
5. Reviewer 檢查需求、程式碼、測試與風險。
6. Integrator 合併已核准 PR，並在 `dev` 執行整合測試。
7. 通過後把 Project Task 狀態更新為 `Dev`；失敗則回原 branch 修正並重新 Review。

## Release

```text
dev
  -> release scope
  -> full validation
  -> release note
  -> approval
  -> main
  -> Project Task: Released
```

1. Releaser 列出本次發布包含的 Project Tasks 與版本號。
2. 在 `dev` 執行 repository 定義的完整品質檢查。
3. 更新 `docs/release-notes/<version>.md`，記錄功能、修正、風險與必要遷移，以及每個發布 Work Item 的 ID、Project Task 路徑與 PR。
4. 建立 `dev -> main` PR，附上驗證證據與 rollback 方式。
5. 核准並合併後完成部署或版本標記。
6. 將包含的 Project Tasks 更新為 `Released`，並回填版本與 release note 路徑。

測試失敗、發布範圍不清楚或缺少 rollback 方案時，不得推進到 `main`。

## Hotfix

```text
main
  -> hotfix/*
  -> focused tests and Review
  -> main
  -> sync dev
```

1. 建立或更新 Project Task，指派 Work Item ID，記錄事故影響、緊急原因與最小修正範圍，並連回相關 System Spec。
2. 從最新 `main` 建立 `hotfix/*` branch。
3. 補上能重現問題的測試，完成最小修正與針對性回歸測試；commit 與 PR 都包含 Work Item ID。
4. Reviewer 核准後透過 PR 合併至 `main` 並發布。
5. 更新 patch release note，列出 Work Item ID、Project Task 路徑與 PR；再回填至 Project Task。
6. 立即將修復同步回 `dev`，執行受影響測試並記錄結果。

Hotfix 不得成為繞過正常 Feature Delivery 的途徑。

## 最小交接資料

每次 Role 交接都至少提供：

- Project Task 與 Spec 路徑。
- Branch、base、commit 與 PR。
- 已完成及未完成的 Acceptance Criteria。
- 已執行的測試命令與結果。
- 已知問題、風險與下一個 Actor 需要執行的工作。
