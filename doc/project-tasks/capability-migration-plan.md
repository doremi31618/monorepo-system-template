# Capability migration plan

## 目標

把 `CS-platform-dashboard`、`CS_platform`、`lark-api-playground` 與
`quantum-qa-tool` 中可重用的功能機制搬入 monorepo。搬遷單位是 capability，
不是原專案的 domain screen、route 或產品名稱。

所有搬遷項目遵守以下邊界：

1. 純核心不能 import NestJS、Express、Svelte、SvelteKit、Drizzle、DOM 或 Chrome API。
2. Framework、storage、browser 與產品規則以明確 adapter package 承接。
3. UI 可以綁定 Svelte 5，但必須透過 props、snippets 與 callbacks 去除產品 domain 綁定。
4. 每個 package 擁有自己的 `test:unit`、fixtures 與公開 API 文件。
5. Svelte UI 必須提供 package-owned Storybook stories；adapter 另外提供 integration tests。

## 來源能力群

| 來源                    | 搬遷能力                                                                                         | 不搬入核心的內容                                |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `CS-platform-dashboard` | durable task、workflow、lease/fencing、event inbox、projection                                   | Telegram operations、account/media projection   |
| `CS_platform`           | collection URL state、view registry、optimistic transition、split workspace、route-backed drawer | Ticket、Customer、Operations screens            |
| `lark-api-playground`   | API interaction views、request/response presentation patterns                                    | Lark-specific endpoint/domain rules             |
| `quantum-qa-tool`       | recipe execution、recording analysis、API contract normalization、reusable editors/views         | QCS login/environment rules、Chrome/DOM runtime |

## 目標 package topology

```text
packages/
├── task-runtime/              # 已建立：framework-neutral task runner
├── task-postgres/             # durable store、lease、fencing、idempotency
├── task-nest/                 # Nest module 與 lifecycle
├── task-express/              # 只有重複 router/middleware 後才建立
├── event-runtime/             # inbox、projector、sequence、dependency graph
├── event-postgres/            # inbox/outbox/checkpoint persistence
├── view-core/                 # collection state、layout、optimistic transition
├── view-svelte/               # 通用功能型 Svelte views
├── view-sveltekit/            # URL、goto、invalidate adapters
├── service-ui/                # 已建立：service/capability showcase
├── recipe-core/               # recipe types、template、validation、runner
├── recipe-ui/                 # RecipeInputControl 等 recipe-aware Svelte UI
├── recording-analysis/        # lineage、flow、whiteboard graph
├── recording-ui/              # VisualContextPreview 等 recording-aware UI
├── api-contract-core/         # OpenAPI/Postman/endpoint normalization
├── api-contract-ui/           # EndpointForm 等 endpoint-aware UI
├── recipe-runtime-browser/    # fetch、File、Worker、DOM adapters
├── recipe-runtime-chrome/     # chrome.tabs/scripting adapters
└── quantum-adapters/          # QCS login 與 Quantum environment policy
```

Package 是否拆分以 dependency boundary 為準，不為單一小元件建立 package。
`recipe-ui`、`recording-ui`、`api-contract-ui` 可先以同一 package 的 subpath
實作；元件數量或 release cycle 足夠大時才獨立。

## Quantum QA UI 搬遷清單

### P0

| 候選元件             | 來源重複                                            | 目標邊界                                                               | 目的地                                |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| `EndpointForm`       | `ApiPoolTab.svelte` 的 create/edit 表單             | `mode`、`EndpointDraft`、`onsubmit`、`oncancel`；API mutation 留在父層 | `api-contract-ui/EndpointForm.svelte` |
| `UiPagination`       | `SiteList`、`ApiPoolTab`、`RecordingTab`            | `page`、`pageCount`、`onchange`、`tone`；切片邏輯放純函式              | `view-svelte/pagination/`             |
| `JsonValueEditor`    | `InputArrayJson`、`InputObjectJson`                 | `kind="array\|object"`、`bind:value`、`minHeight`、validator           | `view-svelte/editors/`                |
| `RecipeInputControl` | `RecipeRunner` 與 `RecipeEditor` Step Test renderer | 統一 input type；提供 `compact` 模式                                   | `recipe-ui/RecipeInputControl.svelte` |

來源：

- `quantum-qa-tool/src/components/toolbox/ApiPoolTab.svelte`
- `quantum-qa-tool/src/components/env/SiteList.svelte`
- `quantum-qa-tool/src/components/tabs/RecordingTab.svelte`
- `quantum-qa-tool/src/components/toolbox/inputs/InputArrayJson.svelte`
- `quantum-qa-tool/src/components/toolbox/inputs/InputObjectJson.svelte`
- `quantum-qa-tool/src/components/toolbox/RecipeRunner.svelte`
- `quantum-qa-tool/src/components/toolbox/RecipeEditor.svelte`

### P1

| 候選元件                          | 目標邊界                                                     | 目的地                                     |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `KeyValueRowsEditor`              | row CRUD 與基本欄位；第三欄以 snippet 擴充 `required` 等語意 | `view-svelte/editors/`                     |
| `VisualContextPreview`            | `PageSnapshot`、`ElementVisualContext`、`onopen`             | `recording-ui/VisualContextPreview.svelte` |
| `UiActionMenu`／`UiConfirmAction` | 組合既有 dropdown/menu primitives；支援 inline confirmation  | `ui/action-menu/`                          |

`VisualContextPreview` 來源為
`quantum-qa-tool/src/components/recording/RelationshipWhiteboard.svelte`。

### P2

| 候選元件                   | 策略                                                          | 目的地                            |
| -------------------------- | ------------------------------------------------------------- | --------------------------------- |
| `UiField`／`UiSearchField` | 新功能先採用，既有約 79 個 `class="field"` 不做一次性全面改寫 | `ui/field/` 與 `ui/search-field/` |

## Quantum QA Engine 搬遷分級

### 可直接搬遷

先複製 characterization tests，再保持函式簽名搬遷；consumer 切換完成前保留
來源 wrapper，避免同時修改演算法與呼叫端。

| 來源模組                     | 目標                                      | 搬遷條件                              |
| ---------------------------- | ----------------------------------------- | ------------------------------------- |
| `src/engine/requestBody.ts`  | `recipe-core/request-body.ts`             | 無外部 import；直接搬測試             |
| `src/engine/arrayInputs.ts`  | `recipe-core/array-inputs.ts`             | 先抽 input types 與 `isPlainObject`   |
| `src/jsonTemplate.ts`        | `recipe-core/json-template.ts`            | 保持 template 行為與錯誤語意          |
| `src/engine/lineage.ts`      | `recording-analysis/lineage.ts`           | 搬入既有 31 個 tests                  |
| `src/recordingWhiteboard.ts` | `recording-analysis/whiteboard-graph.ts`  | 保持 Recording → Graph 輸出           |
| `src/flowContext.ts`         | `recording-analysis/flow-context.ts`      | 使用抽出的 recording types            |
| `src/flowPresentation.ts`    | `recording-analysis/flow-presentation.ts` | 不 import Svelte/UI components        |
| `src/apiPool.ts`             | `api-contract-core/`                      | 拆 endpoint、OpenAPI、Postman exports |

`lineage`、`flowContext`、`flowPresentation`、`recordingWhiteboard` 視為一個完整的
Recording Analysis Engine，一起制定 types、fixtures 與 parity tests，不拆成零散 utils。

### 搬遷前先解耦

#### Recipe runner

`quantum-qa-tool/src/engine/runner.ts` 必須先移除對
`stores/recipes.ts#normalizeRecipeExecutionContext` 的反向依賴。目標介面：

```ts
runRecipe(recipe, context, {
  executeLogin,
  executeApi,
  executeTransform,
  executeJavascript,
  selectOption,
  log,
});
```

`recipe-core` 只保留 orchestration、validation、cancellation 與 step state；實際執行
由 ports 注入。既有 15 個 runner tests 必須先在新 package 通過，再切換 consumer。

#### Recipe logger

把 `src/engine/recipeLogger.ts` 拆成：

- `RecipeLogBuffer`：純 TypeScript，負責 run ID、stale-run protection、max entries。
- `createSvelteRecipeLogger()`：Svelte reactive adapter。

#### Recording evidence

把 `src/recordingEvidence.ts` 拆成：

- `recording-evidence-core.ts`：URL normalization、hash、ID、action inference、flow text cleanup。
- `dom-evidence-collector.ts`：接受 `ParentNode` 的 DOM semantic/container 掃描。

### 保留為 adapter

| 來源                         | 目的地                                               | 原因                                                             |
| ---------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `src/engine/primitives.ts`   | `recipe-runtime-browser/`                            | 使用 fetch、File、Blob、FormData、iframe、Worker、Chrome runtime |
| `src/engine/jsStepRunner.ts` | `recipe-runtime-browser/` + `recipe-runtime-chrome/` | 操作 window/document/chrome.tabs/chrome.scripting                |
| `src/loginPayload.ts`        | `quantum-adapters/qcs-login.ts`                      | MD5 與 QCS payload 有產品語意                                    |
| `src/environments.ts`        | `quantum-adapters/qcs-environments.ts`               | Quantum/QCS environment policy                                   |

## 整合搬遷順序

### Phase 0：Capability foundation（已開始）

- [x] 建立 `task-runtime` core 與 package-owned unit tests。
- [x] 建立 `service-ui` 與 package-owned Storybook stories。
- [x] 建立 package-level `test:unit` contract 與 Storybook browser test gate。
- [ ] 建立 migration parity test helpers 與 source fixture conventions。

### Phase 1：Types 與純核心

1. 從 `quantum-qa-tool/src/types.ts` 抽出 recipe types 與 recording types。
2. 建立 `recipe-core`，搬 `requestBody`、`arrayInputs`、`jsonTemplate`。
3. 建立 `recording-analysis`，整包搬 lineage/flow/whiteboard graph 與 tests。
4. 建立 `api-contract-core`，拆分 `apiPool.ts`。
5. 建立 `view-core`，搬 CS Platform collection URL state、pane layout、optimistic transition。

完成條件：純核心 dependency audit 無 framework/platform imports；source 與 target fixtures
輸出一致；所有 package `test:unit` 通過。

### Phase 2：Execution 與 event runtime

1. 把 recipe runner 改為 port injection，搬既有 runner tests。
2. 拆 `RecipeLogBuffer` 與 Svelte adapter。
3. 建立 `task-postgres` 的 idempotency、claim、lease、fencing、retry persistence。
4. 建立 `task-nest` lifecycle；保留 Express 直接 composition 路徑。
5. 建立 durable event inbox/projector；outbox/pub-sub 另列新增設計，不冒充既有能力。

完成條件：runner 可在 Node test 中使用 fake ports；task store 有 transaction/locking
integration tests；Nest/Express app 不需要 import core implementation details。

### Phase 3：P0 Svelte capability UI

1. `EndpointForm`。
2. `UiPagination` 與純 pagination helpers。
3. `JsonValueEditor`。
4. `RecipeInputControl`，先讓 runner 與 step test 共用同一 renderer。
5. 搬 CS Platform view switcher、Kanban、Timeline、SplitWorkspace 的第一批元件。

每個元件至少提供 default、empty/error、validation、compact/disabled 等適用 stories，
並由 Storybook browser suite 驗證 rendering、interaction 與 configured a11y checks。

### Phase 4：Recording UI 與 platform adapters

1. `VisualContextPreview`、`KeyValueRowsEditor`、action/confirm components。
2. 拆 recording evidence core 與 DOM collector。
3. 建立 browser fetch/worker sandbox adapters。
4. 建立 Chrome main-world/extension adapters。
5. 搬 QCS login/environment 規則到 `quantum-adapters`。

### Phase 5：漸進 consumer 切換

1. 新功能先改用 monorepo packages。
2. 以 compatibility wrapper 保持來源 import path，逐頁切換。
3. 對照 telemetry、fixtures 與 regression tests 後刪除來源重複實作。
4. `UiField`／`UiSearchField` 採 touched-file migration，不做一次性全專案改寫。

## 每個搬遷 PR 的交付清單

- [ ] Core、adapter 與 product policy 放在正確 package。
- [ ] Package 沒有 import `apps/*` 或來源 repo store/UI layer。
- [ ] 原有 tests/fixtures 先複製或建立 parity tests。
- [ ] Package 提供可獨立執行的 `test:unit`。
- [ ] Storage/browser/Chrome adapter 有適當 integration tests。
- [ ] Svelte UI 有 stories、interaction test 與可存取名稱。
- [ ] Public export 與 README 已更新。
- [ ] Consumer 切換前保留 compatibility wrapper。
- [ ] `bun run check`、`bun run test`、`bun run build` 通過。
