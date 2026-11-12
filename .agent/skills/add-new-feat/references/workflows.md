# Delivery Workflows

## Feature Delivery

```text
Project Task
  -> Spec
  -> feat/* branch + worktree
  -> Implementation and tests
  -> Review
  -> dev integration
  -> Project Task: Dev
  -> deploy dev + smoke test
  -> wait for user validation
  -> remove worktree + local/remote feature branch
  -> Release (dev -> main -> deploy prod)
```

1. Owner 在 `docs/project-tasks/` 建立或更新 Work Item，指派唯一且穩定的 Work Item ID。
2. Owner 更新 `docs/system-spec/` 內的必要規格，並在 Task 與 Spec 之間建立含 Work Item ID 的雙向連結。
3. Owner 從最新 `dev` 建立 `feat/*` branch 與獨立 worktree。
4. Owner 實作、測試並開啟 `feat/* -> dev` PR；相關 commit 與 PR 都必須包含 Work Item ID。
5. Reviewer 檢查需求、程式碼、測試與風險。
6. Integrator 合併已核准 PR，並在 `dev` 執行整合測試。
7. 通過後把 Project Task 狀態更新為 `Dev`；失敗則回原 branch 修正並重新 Review。
8. 依 repository 既有流程部署已合併的 `dev` revision，等待部署與 smoke test 成功；記錄版本、部署入口與結果。
9. 請使用者依提供的操作步驟與預期結果驗證 dev，將驗證狀態記錄為「等待使用者驗證」。未收到明確通過回覆前，保留 worktree 與功能分支，不進入 Release。
10. 驗證失敗則回原 worktree 修復，重走 Review、合併、dev 部署與使用者驗證。驗證通過後，依 [worktrees.md](worktrees.md) 清理本次 worktree、local 與 remote 功能分支，再進入 Release。

## Release

```text
dev
  -> deployed and validated by user
  -> worktree and feature branch cleanup
  -> release scope
  -> full validation
  -> release note
  -> approval
  -> main
  -> deploy prod + smoke test
  -> Project Task: Released
```

1. Releaser 列出本次發布包含的 Project Tasks 與版本號，確認 dev 部署、使用者驗證與資源清理的證據。若待發布範圍比使用者驗證版本多出行為變更或其他 Work Item，先釐清範圍並補足 dev 部署與使用者驗證。
2. 在 `dev` 執行 repository 定義的完整品質檢查。
3. 更新 `docs/release-notes/<version>.md`，記錄功能、修正、風險與必要遷移，以及每個發布 Work Item 的 ID、Project Task 路徑與 PR。
4. 建立 `dev -> main` PR，附上驗證證據與 rollback 方式。
5. 核准並合併後，依既有流程將 `main` revision 部署到 prod，等待部署與 smoke test 成功；版本標記不能取代部署。記錄 commit、部署 URL／job／run ID 與結果。
6. prod 驗證成功後，將包含的 Project Tasks 更新為 `Released`，並回填版本與 release note 路徑。若部署或 smoke test 失敗，依既有 rollback 流程處理並回報，不宣告完成。

測試失敗、發布範圍不清楚或缺少 rollback 方案時，不得推進到 `main`。

使用者已授權完整交付流程時，dev 驗證確認通過即繼續清理、合併與 prod 部署，不重複詢問相同授權；repository 必要的 Review 與 CI 仍須完成。

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
