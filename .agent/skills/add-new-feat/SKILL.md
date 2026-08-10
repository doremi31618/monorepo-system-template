---
name: add-new-feature
description: 追加新功能或功能變更的標準交付流程。當使用者要求新增功能、追加需求、功能變更、implement a feature、add feature，或需要從需求分析、需求釐清、規格、獨立分支實作、測試、審核、整合到 release note 的完整流程時使用。每次開始前先詢問是否啟用 Grill Me 需求釐清模式。適用於人或 Agent 協作；依當下角色與工作內容分工，不以執行者類型區分流程。
---

# Add New Feature

以最少但可追蹤的流程交付功能。保留專案既有的 `docs/` 文件架構，不建立平行的文件空間。

## 核心原則

- Actor 可以是人或 Agent；權責由當下扮演的 Role 決定。
- 每個功能從最新 `dev` 建立獨立 `feat/*` branch；多人或多 Agent 並行時優先使用獨立 worktree。
- `feat/*` 只能透過審核後的 PR 進入 `dev`；`dev` 通過整合驗證後才能進入 `main`。
- Owner 不可成為同一項變更的唯一 Reviewer。
- 規格、Project Task、程式碼、測試與交接資訊必須可互相追蹤。
- 每個 Work Item 必須有唯一且穩定的 `Work Item ID`；此 ID 必須出現在 Project Task、相關 System Spec、branch、commit、PR 與 release note，讓任一紀錄都能回溯完整交付鏈。
- 不直接在 `dev` 或 `main` 實作功能，不 force push 共用分支。

## Requirements Discovery Gate（Grill Me）

每次觸發本 Skill 時，先詢問使用者是否啟用 `Grill Me`，再進入 Preflight：

- 預設建議啟用。只有明確表示「跳過 Grill Me」、「不要需求訪談，直接走標準流程」或同等語意，才可略過；略過只對當次 Work Item 有效。
- 「開始吧」、「照常處理」、「不用問了」或「你決定」不構成明確跳過，必須確認。使用者明確要求「開始實作」或「直接開發」時，依訪談 reference 的提前實作與風險承擔規則處理。
- 使用者明確略過時，保留本 Skill 原有的歧義與高風險停止條件，並在 Project Task 記錄跳過、未驗證假設與已知風險。
- 使用者啟用時，完整讀取並遵循 [references/requirements-interview.md](references/requirements-interview.md)。一次只問一個決策問題，每題提供建議答案並等待回覆；能從環境唯讀查證的事實不可詢問使用者。
- 訪談內預設最多 20 個問題；啟用詢問不計入。第 20 題必須用於共同理解確認，或在仍有未決事項時提出具體的新上限並取得延長同意。
- 未完成共同理解與授權前，只可做 reference 允許的唯讀探索；不得建立或修改 Project Task、規格、branch、worktree、程式碼或其他交付產物。
- 使用者核准共同理解摘要後才解除閘門。在最終核准問題的上下文中，`OK`、`Yes` 或「可以」即為有效授權。
- 實作期間發現會改變需求或風險的新歧義時，重新鎖定受影響範圍並回到對應訪談分支。

開始前按需要讀取：

- 需求釐清閘門與決策樹：[references/requirements-interview.md](references/requirements-interview.md)
- 分支用途與合併規則：[references/branches.md](references/branches.md)
- 並行開發與 worktree 生命週期：[references/worktrees.md](references/worktrees.md)
- 角色責任與交接條件：[references/roles.md](references/roles.md)
- Feature、Release、Hotfix 流程：[references/workflows.md](references/workflows.md)
- 既有 Project Task 的協作欄位模板：[references/project-task-template.md](references/project-task-template.md)

## 標準流程

### 1. Preflight

1. 確認 repository、目前 branch、remote 與 working tree 狀態。
2. 沿用專案目前的 `docs/` 文件根目錄與既有分類，不搬移文件。
3. 閱讀與需求相關的：
   - `docs/developer-onboarding.md`
   - `docs/design-principles.md`
   - `docs/business-logic-handbook.md`
   - `docs/architecture/`
   - `docs/system-spec/`
   - `docs/project-tasks/`
4. 不覆蓋、重設或混入其他 Actor 的未提交變更。若工作區不乾淨且變更可能衝突，建立新的 worktree。
5. 執行 `git worktree list --porcelain`，確認目標 branch 與 worktree 沒有被其他 Work Item 使用。

### 2. 建立 Project Task

在 `docs/project-tasks/` 新增或更新對應文件，直接把它當作本次 Work Item，不建立另一個 Work Item 目錄。

至少記錄：

- Work Item ID
- Status：`Todo`、`Doing`、`Review`、`Dev` 或 `Released`
- Actor、Role、Branch、Base、PR
- 相關 System Spec、commit 與 release/version
- Objective、Acceptance Criteria、Scope、Required Tests
- 任務清單、重要決策、已知問題與 Handoff

使用 [references/project-task-template.md](references/project-task-template.md) 的欄位，但配合既有文件格式，不強制整份重寫。

### 3. 規格先行

在 `docs/system-spec/` 新增或更新既有規格：

- Product Spec：目的、使用者價值、核心行為、邊界與驗收條件。
- Technical Spec：架構、資料流、API/DTO、資料模型、權限、安全與錯誤處理。
- UI 功能：補充畫面狀態、互動、響應式與可及性需求；只有真正需要視覺設計時才產生 mockup。

在規格開頭或相關段落記錄 `Work Item ID` 與 Project Task 路徑；Project Task 也必須連回對應的規格檔案或段落。若一份規格涵蓋多個 Work Item，列出所有適用 ID。

小型變更可更新現有規格段落，不為了流程複製文件。驗收條件不清楚或涉及產品、資安、資料遷移與跨 Domain 決策時，先請求確認。

### 4. 建立隔離分支

從最新 `dev` 建立：

```bash
git switch dev
git pull --ff-only
git switch -c feat/<work-id>-<short-name>
```

多人或多 Agent 同時開發時，依 [references/worktrees.md](references/worktrees.md) 為每個 Work Item 建立獨立 worktree。分支名稱、base 與 worktree 路徑記錄在 Project Task。

### 5. 實作與驗證

- 遵循 `docs/developer-onboarding.md`、`docs/design-principles.md`、`docs/business-logic-handbook.md` 與既有 Domain 邊界。
- 保持變更只涵蓋本 Work Item；發現額外需求時回寫 Project Task，不靜默擴張範圍。
- 對核心邏輯撰寫 unit tests，對關鍵使用者路徑撰寫 integration/E2E tests。
- 執行 repository 已定義的 formatter、lint、typecheck、unit、E2E 與 build。
- 若有測試無法執行，記錄命令、原因、風險與待驗證項目，不可宣稱通過。
- Commit 使用 Conventional Commits，並包含 Work Item ID，例如 `feat(customer): add identity binding (CSP-142)`。

### 6. Review 與合併至 dev

1. Owner 將 Project Task 更新為 `Review`，提交 PR：`feat/* -> dev`。
2. PR 必須包含 Work Item ID、規格與 Project Task 連結、變更摘要、測試證據、已知風險及必要的 rollback 說明。
3. Reviewer 依 [references/roles.md](references/roles.md) 檢查需求、程式碼與測試。
4. 通過 Review 與必要 CI 後，由 Integrator 合併至 `dev`。
5. 在 `dev` 執行整合驗證；通過後將 Project Task 更新為 `Dev`。

若發生 merge conflict、測試失敗需要產品或架構取捨，停止自動合併並請求決策。

### 7. 發布至 main

- Releaser 確認預定範圍已在 `dev` 通過完整驗證。
- 在 `docs/release-notes/` 更新符合專案 Semantic Versioning 規則的 release note。
- Release note 必須列出每個已發布 Work Item 的 ID、Project Task 路徑與 PR，並由 Project Task 回填最終版本與 release note 路徑。
- 透過 PR 將 `dev` 合併到 `main`，完成必要檢查與核准後發布。
- 發布完成後將 Project Task 更新為 `Released`，補上 release/version 與最終連結。

Hotfix 不走 feature branch；遵循 [references/workflows.md](references/workflows.md) 的 Hotfix 流程，修復進入 `main` 後必須同步回 `dev`。

## 完成條件

只有以下條件全部成立才可宣告完成：

- Acceptance Criteria 已逐項驗證。
- 規格與 Project Task 已同步。
- 必要測試、靜態檢查與 build 已通過，或未執行項目已明確揭露。
- Review、`dev` 整合與 `main` 發布皆可追蹤。
- Release note 已更新。
- 沒有夾帶其他 Work Item 或其他 Actor 的變更。
