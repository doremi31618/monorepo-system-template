# Project Task Collaboration Fields

沿用 `docs/project-tasks/<feature>.md` 的既有格式。只補上缺少的協作欄位，不建立新的 Work Item 目錄，也不要求重寫既有內容。

```markdown
# [Feature] Project Task

> **Work Item ID**: CSP-142
> **Status**: Todo | Doing | Review | Dev | Released
> **Actor**: [目前執行者]
> **Role**: Owner | Reviewer | Integrator | Releaser
> **Branch**: feat/<work-id>-<short-name>
> **Base**: dev
> **Worktree**: ../<repo-name>-worktrees/<work-id>-<short-name>
> **PR**: [URL or pending]
> **Related Spec**: `docs/system-spec/<feature>.md#<section>`
> **Release**: [version and `docs/release-notes/<version>.md`, or pending]
> **Last updated**: YYYY-MM-DD

## Objective

[這次要解決的問題與預期價值]

## Discovery / Shared Understanding

- **Mode**: Grill Me enabled | explicitly skipped
- **Gate status**: Pending | Approved | Bypassed by explicit instruction
- **Approved or bypassed at**: YYYY-MM-DD
- **Summary**: [共同理解摘要；若略過則記錄略過指示]
- **Key decisions**: [會改變產品行為或交付風險的決策]
- **Assumptions**: [尚未驗證的假設；沒有則填 None]
- **Risks and acceptance**: [已揭露風險、降低方式與承擔結果；沒有則填 None]

## Acceptance Criteria

- [ ] 可觀察、可驗證的條件 1
- [ ] 可觀察、可驗證的條件 2

## Scope

### In scope

- [本次包含]

### Out of scope

- [本次明確不處理]

## Technical Design Review

- **Design**: [七項說明所在的 System Spec 連結與版本／日期；細節只維護在規格中]
- **Approval required**: [新增資料表、架構變更、新增資源的具體項目；無則寫 None 並附理由]
- **Approval status**: Pending | Approved | Not required
- **User confirmation**: [明確同意內容、日期、決策項目及對應規格版本；未回覆不得填 Approved]
- **Implementation comparison**: [符合設計或實際差異、必要的重新核准紀錄、關鍵程式位置與驗證證據連結]

## Required Tests

- [ ] Unit: [範圍]
- [ ] Integration/E2E: [關鍵路徑]
- [ ] Lint / typecheck / build

## Tasks

- [ ] Spec
- [ ] Seven-part technical design and required user approvals
- [ ] Implementation
- [ ] Tests
- [ ] Review, including design-to-implementation comparison
- [ ] Dev integration
- [ ] Dev deployment and smoke test
- [ ] User validation on dev
- [ ] Worktree and local/remote feature branch cleanup
- [ ] Release note
- [ ] Merge dev into main
- [ ] Prod deployment and smoke test

## Deployment / User Validation

- **Dev**: [commit、URL／job／run ID、部署與 smoke test 結果]
- **Validation steps**: [驗證入口、操作步驟與預期結果]
- **User validation**: Pending | Passed | Failed
- **User confirmation**: [使用者明確確認內容、日期與驗證版本；未回覆不得填 Passed]
- **Cleanup**: [本次 worktree、local 與 remote 功能分支的清理結果]
- **Prod**: [main commit、URL／job／run ID、部署與 smoke test 結果]

## Decisions and Work Log

- YYYY-MM-DD: [重要決策、原因與影響]

## Handoff

- **Commit/PR**: [`<commit>` (`<Work Item ID>`), PR link]
- **Branch/Worktree**: [branch 與絕對路徑]
- **Validation**: [實際命令與結果]
- **CLI / Model**: [目前工作類型、CLI 與明確模型 ID]
- **Model fallback**: [None，或 Claude 用量耗盡證據、原模型、Codex 接手模型與交接進度]
- **Known issues**: [沒有則填 None]
- **Next action**: [下一角色要執行的工作]
```

`Work Item ID` 是交付鏈的唯一追蹤鍵，必須同時出現在：

- Project Task 與相關 System Spec（雙向連結）。
- `feat/<work-id>-<short-name>` 或 `hotfix/<work-id>-<short-name>` branch，以及 worktree 路徑。
- 每個與本 Work Item 有關的 commit 與 PR。
- 包含本 Work Item 的 release note；發布後回填版本與 release note 路徑至 Project Task。

若既有規格或 release note 涵蓋多個 Work Item，請列出所有適用 ID 與對應連結。

## 狀態定義

- `Todo`：目標已記錄，尚未開始。
- `Doing`：Owner 正在處理規格、實作或測試。
- `Review`：變更已可供 Reviewer 獨立審核。
- `Dev`：已合併 `dev` 並通過整合驗證；部署與使用者驗證進度另記於 Deployment / User Validation，不能僅憑此狀態判定可發布。
- `Released`：已隨核准版本進入 `main`，prod 部署及 smoke test 成功，並完成發布紀錄。
