# Worktree Collaboration

一個 Work Item 對應一個 branch 與一個 worktree。Worktree 只隔離工作目錄；branch、commit 與 remote 仍由同一個 repository 共用。

## 目錄規則

- 主工作目錄：固定 checkout `dev`，供 Integrator 執行整合與驗證。
- Feature worktree：`../<repo-name>-worktrees/<work-id>-<short-name>`。
- Feature branch：`feat/<work-id>-<short-name>`。
- Hotfix 使用相同目錄規則，但 branch 為 `hotfix/<work-id>-<short-name>`。
- Actor 接到已建立的 worktree 時直接使用，不在其中切換到其他 branch。

範例：

```text
CS_platform/                                  -> dev
CS_platform-worktrees/CSP-142-customer-bind/ -> feat/CSP-142-customer-bind
CS_platform-worktrees/CSP-155-notifications/ -> feat/CSP-155-notifications
```

## 建立前檢查

```bash
git status --short
git branch --show-current
git worktree list --porcelain
git branch --list feat/<work-id>-<short-name>
```

確認：

- 主工作目錄沒有會被操作影響的未提交變更。
- 目標 branch、Work Item 與目錄名稱沒有被占用。
- `dev` 或 `origin/dev` 存在且是本次功能的正確 base。
- 若 repository 尚未建立 `dev`，停止並請 Repository Owner 明確初始化，不由 Feature Owner 自行創建共用分支。

## 建立新 worktree

先更新 remote 資訊，再從 `origin/dev` 建立 branch 與 worktree：

```bash
git fetch origin
git worktree add \
  ../<repo-name>-worktrees/<work-id>-<short-name> \
  -b feat/<work-id>-<short-name> \
  origin/dev
```

建立後進入新目錄並驗證：

```bash
cd ../<repo-name>-worktrees/<work-id>-<short-name>
git branch --show-current
git status --short
```

把 branch、base 與 worktree 的絕對路徑記錄在 Project Task。

## 接手既有 branch

先用 `git worktree list --porcelain` 確認 branch 尚未在其他 worktree 使用，再執行：

```bash
git worktree add \
  ../<repo-name>-worktrees/<work-id>-<short-name> \
  feat/<work-id>-<short-name>
```

若 branch 已被其他 worktree 使用，不建立第二份目錄；透過 Project Task 交接原 worktree，或請原 Owner 完成提交與釋放。

## 工作期間

- 一個 worktree 同一時間只交由一個 Owner 寫入。
- 不在 feature worktree 執行 `git switch dev` 或切換到其他 Work Item 的 branch。
- 不共用未提交檔案；交接前先建立可追蹤 commit，並更新 Project Task。
- 安裝依賴、產生檔案與測試結果都限制在該 worktree，避免修改其他工作目錄。
- 每次開始工作前確認 branch；提交前檢查 diff 只包含本 Work Item。

## 合併後清理

只有 PR 已合併、Project Task 已更新，而且 worktree 沒有未提交或未推送工作時才能清理：

```bash
git -C ../<repo-name>-worktrees/<work-id>-<short-name> status --short
git worktree remove ../<repo-name>-worktrees/<work-id>-<short-name>
git branch -d feat/<work-id>-<short-name>
git worktree list
```

清理前若 `status --short` 有輸出，停止並通知 Owner。禁止使用 `--force`、直接刪除 worktree 資料夾，或以 `git branch -D` 跳過未合併保護。

## 禁止事項

- 兩個 Actor 同時寫入同一個 worktree。
- 同一 branch 同時用於兩個 Work Items。
- 在主工作目錄直接實作 feature。
- 未檢查狀態就移除或重建 worktree。
- 使用 `git reset --hard`、`git clean` 或其他破壞性命令處理交接問題。
