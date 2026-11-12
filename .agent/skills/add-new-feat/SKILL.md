---
name: add-new-feature
description: 追加新功能或功能變更的標準交付流程。當使用者要求新增功能、追加需求、功能變更、implement a feature、add feature，或需要從需求分析、需求釐清、規格、獨立分支實作、測試、審核、整合到 release note 的完整流程時使用。每次開始前先詢問是否啟用 Grill Me 需求釐清模式。適用於人或 Agent 協作；依當下角色與工作內容分工，不以執行者類型區分流程。
---

# Add New Feature

以最少但可追蹤的流程交付功能。保留專案既有的 `docs/` 文件架構，不建立平行的文件空間。

## 核心原則

- Actor 可以是人或 Agent；權責由當下扮演的 Role 決定。
- 每個功能或一般修復從最新 `dev` 建立獨立 `feat/*` branch 與 worktree。
- `feat/*` 只能透過審核後的 PR 進入 `dev`；`dev` 通過整合驗證後才能進入 `main`。
- Owner 不可成為同一項變更的唯一 Reviewer。
- 規格、Project Task、程式碼、測試與交接資訊必須可互相追蹤。
- 每個 Work Item 必須有唯一且穩定的 `Work Item ID`；此 ID 必須出現在 Project Task、相關 System Spec、branch、commit、PR 與 release note，讓任一紀錄都能回溯完整交付鏈。
- 不直接在 `dev` 或 `main` 實作功能，不 force push 共用分支。
- 標準交付順序：獨立 worktree 實作 → Review → 合併 `dev` → 部署 dev → 使用者驗證通過 → 清理 worktree 與功能分支 → 合併 `main` → 部署 prod。
- dev 部署後必須等待使用者明確確認驗證通過；在此之前保留 worktree 與功能分支，不推進 `main` 或 prod。使用者已授權完整流程時，確認通過後直接完成後續步驟，不重複索取相同授權。
- 若 Work Item 由 Lark Backlog 追蹤，正式發布的 PR 必須追加註記在該筆 Backlog 既有的交付物欄位（例如 `交付物 / 驗收標準`），格式為 `PR（main）：<dev -> main PR URL>`。必須保留欄位內原有交付物，不可填入 `feat/* -> dev` PR；寫入後必須回讀並確認 URL 已存在且完全一致。
- 每個 Work Item 結束前都必須執行 UI Module Catalog 維護檢查。若變更影響既有 UI module、互動模式、使用規則或頁面採用狀態，更新對應 catalog／usage audit；若不影響，也要在 Project Task 記錄「已檢查、無需更新」及理由，不可默認略過。

## CLI 與模型分工

本 Skill 的工作預設透過 Claude Code CLI 執行；Claude 用量耗盡時，改用 Codex CLI，依下表選擇模型。此分工取代本流程先前的一般開發 Sonnet、debug Opus 預設；使用者當次較新的明確模型指示優先。

| 工作類型 | 主要：Claude Code CLI | 用量耗盡備援：Codex CLI |
| --- | --- | --- |
| 管理專案、進度協調與交付管理 | Opus：`claude --model opus` | GPT-5.6 Sol：`codex --model gpt-5.6-sol` |
| 執行開發、功能實作 | Opus：`claude --model opus` | GPT-5.6 Terra：`codex --model gpt-5.6-terra` |
| Debug、錯誤修復與 review finding 修正 | Fable：`claude --model fable` | GPT-6 Astra：`codex --model gpt-6-astra` |
| 撰寫文件、規格與計劃 | Fable：`claude --model fable` | GPT-6 Astra：`codex --model gpt-6-astra` |

- 依目前實際工作選模型，不以 Actor 或整個 Work Item 固定一個模型。例如管理專案使用 Opus，進入寫計劃階段改用 Fable。
- 啟動或恢復 CLI session 時明確指定模型；工作類型改變時重新選擇模型，不假設同一 session 會自動切換。表內命令示範模型參數，互動或非互動執行方式依 CLI 支援與當前工作選擇。
- 從本次 Work Item 的 worktree 執行開發與修復，向 CLI 提供需求、規格、驗收條件、相關檔案及既有授權範圍；沿用本 Skill 的 Review、部署與使用者驗證流程。

### Claude 用量耗盡時的交接

1. 以 CLI 明確回報的用量／配額耗盡結果作為切換依據；一般網路錯誤、暫時限流、模型不存在或登入失敗不等同用量耗盡。
2. 確認原 CLI 已停止寫入，保存並檢查目前 diff、未提交工作、測試結果與下一步；不得讓兩個 CLI 同時修改同一 worktree。
3. 簡短告知使用者切換原因與目標模型，在 Project Task 的 Handoff 記錄原 CLI／模型、配額狀態、接手模型與未完成工作；尚未解除需求釐清閘門時先保留對話內交接，不提前建立交付文件。
4. 使用同一 worktree，由表內對應的 Codex CLI 模型接續工作，明確提供交接摘要與檔案路徑；不假設 Claude session 記憶會自動傳入 Codex，不重做已完成步驟或丟棄既有變更。
5. 該次工作後續依 Codex 備援欄選模型，不逐步重試已耗盡的 Claude 額度。新 Work Item 預設仍先使用 Claude；當已知額度尚未恢復時沿用 Codex。指定備援模型也不可用時，回報阻塞與已保存進度，不擅自替換其他模型。

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
- 七項技術設計說明與核准規則：[references/technical-design-review.md](references/technical-design-review.md)。每個 Work Item 在規格與實作前必須完整讀取，Review 時再次依此核對實作。
- UI module 統一規則、catalog 欄位與維護判定：[references/ui-module-catalog.md](references/ui-module-catalog.md)。只要 Work Item 涉及使用者介面、互動模式、UI primitives 或前端 module，就必須在規格與實作前完整讀取；所有 Work Item 在完成前仍須執行其中的維護檢查。

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
- Actor、Role、Branch、Base、Dev PR、Main PR
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

依 [references/technical-design-review.md](references/technical-design-review.md) 在既有 Technical Spec 中提供七項設計說明：後端 API、Table / Schema、Service / Mechanism、Resources；前端 UX 流程、UI 元件、Service / Mechanism。每項標示「沿用／修改／新增／不涉及」，向使用者呈現重點與規格連結。新增資料表、架構變更或新增資源須先取得使用者明確同意，並在 Project Task 記錄核准範圍與對應規格版本；未核准前只可繼續唯讀調查、設計及不依賴該決策的工作。

### 4. 建立隔離分支與 worktree

依 [references/worktrees.md](references/worktrees.md) 從最新 `origin/dev` 建立獨立 branch 與 worktree：

```bash
git fetch origin
git worktree add ../<repo-name>-worktrees/<work-id>-<short-name> \
  -b feat/<work-id>-<short-name> origin/dev
```

分支名稱、base 與 worktree 絕對路徑記錄在 Project Task；後續實作與測試在該 worktree 進行。

### 5. 實作與驗證

- 遵循 `docs/developer-onboarding.md`、`docs/design-principles.md`、`docs/business-logic-handbook.md` 與既有 Domain 邊界。
- 保持變更只涵蓋本 Work Item；發現額外需求時回寫 Project Task，不靜默擴張範圍。
- 依已確認的技術設計實作；若需新增未核准的資料表、架構變更或資源，先更新七項說明並取得該決策的同意，再繼續受影響的實作。
- 對核心邏輯撰寫 unit tests，對關鍵使用者路徑撰寫 integration/E2E tests。
- 功能實作完成後，若有調整 DB schema，最終驗證必須依序完成：
  1. 使用 repository 的既有指令產生 migration，並人工檢查 SQL、snapshot 與 migration history。
  2. 確認連線目標是開發環境 DB，不得誤用 staging 或 production；不得在紀錄中輸出密碼、token 或完整連線字串。
  3. 以獨立的一次性指令手動對 dev DB 執行 migration；不可把 migration 塞進 API bootstrap 或一般服務啟動流程。
  4. 只有 migration 成功後，才執行並採認完整的 formatter、lint、typecheck、unit、integration/E2E 與 build 驗證。開發期間可先跑 TDD 的 RED／GREEN 測試，但 migration 後必須重跑，先前結果不可作為最終證據。
- 若 dev migration 無法執行或失敗，停止後續最終驗證，記錄命令、目標環境（不得含 secrets）、錯誤與風險；不可用 mock、單元測試或成功 build 取代真實 migration，亦不可宣稱功能已完成。
- 執行 repository 已定義的 formatter、lint、typecheck、unit、E2E 與 build。
- 若有測試無法執行，記錄命令、原因、風險與待驗證項目，不可宣稱通過。
- 依 [references/ui-module-catalog.md](references/ui-module-catalog.md) 執行 UI Module Catalog 維護檢查：
  1. 找出 repository 既有的 UI Module Catalog 與 UI Usage Audit；若功能包含 UI、但 repository 尚無對應文件，沿用既有 `docs/` 架構建立一份，不在專案外維護專案狀態。
  2. 檢查本次變更是否新增、替換、淘汰或改變 UI module 的 interface、既定 UX、允許情境、禁止做法、響應式行為、可及性要求、必要測試或頁面採用狀態。
  3. 有影響時，在同一 Work Item 更新 catalog／usage audit、規格與必要測試；跨專案的共用規則改變時，同步維護本 Skill 的 reference。
  4. 無影響時，在 Project Task 的 Verification 或 Handoff 記錄 `UI Module Catalog: reviewed — no change`，並附一行理由。
- UI module 檢查未完成或只有口頭判斷、沒有 Project Task 證據時，不得進入 Review。
- Commit 使用 Conventional Commits，並包含 Work Item ID，例如 `feat(customer): add identity binding (CSP-142)`。

### 6. Review 與合併至 dev

1. Owner 將 Project Task 更新為 `Review`，提交 PR：`feat/* -> dev`。
2. PR 必須包含 Work Item ID、規格與 Project Task 連結、變更摘要、測試證據、已知風險及必要的 rollback 說明。
3. Reviewer 依 [references/roles.md](references/roles.md) 檢查需求、程式碼與測試，並依 [references/technical-design-review.md](references/technical-design-review.md) 核對七項設計、實際差異、核准紀錄與驗證證據。Owner 須先將實際結果同步至規格並提供關鍵程式位置；發現未核准的資料表、架構變更或新增資源時，不得以事後補寫規格取代核准，也不得合併。
4. 通過 Review 與必要 CI 後，由 Integrator 合併至 `dev`。
5. 在 `dev` 執行整合驗證；通過後將 Project Task 更新為 `Dev`。

若發生 merge conflict、測試失敗需要產品或架構取捨，停止自動合併並請求決策。

### 7. 部署 dev 並請使用者驗證

1. 查閱 repository 既有部署文件與 CI/CD，確認 dev 的部署入口與環境；部署已合併的 `dev` revision，等待部署完成並執行適用的 smoke test。自動部署也必須確認結果，不把合併成功視為部署成功。
2. 在 Project Task 記錄 dev commit、部署 URL／job／run ID、部署與 smoke test 結果，並標示「等待使用者驗證」。
3. 提供 dev 網址或驗證入口、具體操作步驟與預期結果，明確請使用者驗證；此時保留 worktree 與功能分支，暫停清理及發布。
4. 使用者明確確認該部署版本驗證通過後，記錄確認內容與對應版本。驗證失敗則回原 worktree 修復、重新 Review、合併與部署 dev，再請使用者驗證；未回覆不視為通過。

### 8. 清理 worktree 與功能分支

使用者驗證通過後，依 [references/worktrees.md](references/worktrees.md) 確認 PR 已合併、工作已保存且沒有其他使用者或 Work Item 占用，再移除本次 worktree、local 與 remote 功能分支。保留 `dev`、`main` 與 Project Task、PR、commit、部署及驗證紀錄；不得在合併 `dev` 時提前自動刪除功能分支。

### 9. 合併 main 並部署 prod

- Releaser 確認預定範圍已在 `dev` 通過完整驗證及使用者驗證，並完成本次 worktree 與功能分支清理。比較待發布 `dev` 與使用者驗證版本；若多出未驗證的行為變更或其他 Work Item，先釐清範圍並補足 dev 部署與使用者驗證，不夾帶發布。
- 在 `docs/release-notes/` 更新符合專案 Semantic Versioning 規則的 release note。
- Release note 必須列出每個已發布 Work Item 的 ID、Project Task 路徑與 PR，並由 Project Task 回填最終版本與 release note 路徑。
- 透過 PR 將 `dev` 合併到 `main`，完成必要檢查與核准後發布。
- `dev -> main` PR 一建立並取得正式 URL，就在此次發布涵蓋的每一筆 Lark Backlog 既有的交付物欄位追加一行 `PR（main）：<URL>`；同一個 release PR 涵蓋多個 Work Item 時，每筆都寫入同一 URL。必須保留既有交付物內容、避免重複追加相同 URL，且不得把功能分支的 Dev PR 寫入此欄位。
- 寫入前先讀取 Base 欄位 schema 與目前 record，以 schema 中唯一且可寫的交付物文字欄位為準（名稱可能是 `交付物` 或 `交付物 / 驗收標準`），確認目標 record ID 正確，並以既有內容為基礎追加註記；若找不到、出現多個無法唯一判定、欄位唯讀或 record 無法唯一對應，停止該筆追蹤更新並回報，不自行新增欄位或猜測記錄。寫入後重新讀取 record，驗證既有內容仍保留，且實際 Main PR URL 已存在並完全一致。
- 依 repository 既有部署流程部署已合併的 `main` revision 到 prod；等待部署結果，執行適用的 smoke test，記錄 commit、部署 URL／job／run ID 與結果。部署或 smoke test 失敗時依既有 rollback 流程處理並回報，不宣告完成。
- prod 部署與 smoke test 成功後將 Project Task 更新為 `Released`，補上 release/version 與最終連結。

Hotfix 不走 feature branch；遵循 [references/workflows.md](references/workflows.md) 的 Hotfix 流程，修復進入 `main` 後必須同步回 `dev`。

## 完成條件

只有以下條件全部成立才可宣告完成：

- Acceptance Criteria 已逐項驗證。
- 規格與 Project Task 已同步。
- 七項技術設計說明、必要的使用者核准及實作對照審查已完成；規格與 Project Task 可追蹤核准範圍、實際差異、關鍵程式位置與驗證證據。
- 必要測試、靜態檢查與 build 已通過，或未執行項目已明確揭露。
- 若 DB schema 有變更，dev migration 已手動執行成功，且完整測試已在 migration 後重跑；Project Task 留有不含 secrets 的命令與結果證據。
- Review、`dev` 整合與 `main` 發布皆可追蹤。
- dev 已部署，且使用者已明確確認對應版本驗證通過。
- 本次 worktree、local 與 remote 功能分支已清理，無遺失工作。
- `main` 已部署到 prod，部署結果與 smoke test 可追蹤且成功。
- Release note 已更新。
- 若使用 Lark Backlog，所有已發布 Work Item 的交付物欄位都已保留既有內容、追加實際 Main PR URL，並完成回讀驗證。
- UI Module Catalog 與 UI Usage Audit 已更新，或 Project Task 已記錄 `reviewed — no change` 與理由。
- 沒有夾帶其他 Work Item 或其他 Actor 的變更。
