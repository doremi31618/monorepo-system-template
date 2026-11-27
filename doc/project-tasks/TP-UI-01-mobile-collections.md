# TP-UI-01 R6/R7 generic mobile collections promotion

Work Item ID: TP-UI-01
Status: Review — R7 generic source, CUA and independent closure GO; upstream PR/CI pending; audit decision not granted
Branch: codex/TP-UI-01-mobile-collections
Base: origin/dev c7783e0c3ee2912eab61acea76dc7bca3811a26a
Spec: ../system-spec/TP-UI-01-mobile-collections.md

User approved R6, explicitly requested monorepo promotion then Databricks Pipeline transplant, and reordered delivery to Talent Pool Dev first. This prerequisite is satisfied: TP dev dec05242fe2b8e079535f438b7f90d24642a1cc0, PR https://github.com/SIRAYA-TECHNOLOGIES/talent-pool/pull/63, App deployment01f1ea4095471a9cb61bda1d1be7ebcd SUCCEEDED, exact8routes/2assets, REST/MCP19permissions, resource/Job settings unchanged. Source implementation64f5a17 (docs headb7af0ac; identical whole Git tree to merged Dev).

This continues the approved TP-UI-01 scope/early implementation; no new requirement interview needed. Preserve user's uncommitted main checkout and all other worktrees. Existing backend/API/schema/resources/permissions/query semantics are outside scope. No npm publish/main/Production or worktree cleanup before user Dev validation.

Implementation CLI: Sonnet; debugging and independent review: Opus, per user preference. Root handles commits/PR/merges. This library has no new standalone Dev resource; consumer acceptance uses TP Dev and subsequent Databricks Pipeline import.

Tasks: generic components/contract tests; UI catalog + usage + provenance; independent review; PR to dev and CI; downstream pinned import.

## Implementation record (2026-11-27, Sonnet; uncommitted for root review)

Changed: `packages/svelte/ui/src/lib/ui/notion-table/*` (NotionTable, NotionMoreMenu, ColumnDisplay, column-pref helpers, labels, `NotionCommand`), `ui/checkbox/*` (upstream had no Checkbox; ported the generic bits-ui primitive), `DataViewToolbar` responsive layout only, README, `architecture/ui-module-catalog.md` (NOTION-TABLE-001 + usage/provenance), `architecture/data-view-toolbar.md`, Storybook `NotionTable.stories.svelte` (synthetic rows) and the updated persistent-search story. No `package.json`/`bun.lock` change; `bun install --frozen-lockfile` used.

TDD: RED first — `tests/notion-table-columns.test.ts` and `tests/notion-table-public-contract.test.ts` failed with "Cannot find module" before the modules existed (23 -> 33 package tests after GREEN). Limits: the Svelte components themselves were imported from the proven TP source (not re-derived test-first); their rendering is covered by the Storybook story and TP's 512 Playwright / 34 Bun evidence, not by new bun DOM tests. Toolbar CSS has no RED test (no CSS seam); a Storybook assertion (persistent search visible on a 320px phone, filter trigger >=44px and on the search row) was added instead and was not observed RED against the old code.

Results: package `bun test` 33 pass; `svelte-check` 0 errors/0 warnings; `svelte-package` build OK; `deps:check` and `deps:graph:check` pass; `build:packages` OK; Storybook Chromium run 11 files / 82 tests pass.

Debugging note: the first toolbar attempt used `max-md:size-11`, which clipped visible labels at 640-767px and failed 10 DataViewToolbarCapacity stories (15/15 on the original toolbar, verified by swapping in HEAD's file); fixed with `min-h-11 min-w-11`, Capacity back to 15/15.

Behavior change to flag: `searchMode="persistent"` now stays visible on phones (R6). Previously it rendered as a toggle there; the old story/doc statements were replaced. `toggle` and desktop are unchanged.

Not done / not claimed: no browser/CUA manual check, no real-device keyboard check, no commit/push/PR. Root-level `bun run test` (API/Web suites) and the dependency audit were not run here.

## Review corrections (2026-11-27, Opus; independent review REQUEST CHANGES)

1. Typography (required): `notion-table.svelte` and `column-display.svelte` used TP-only theme tokens `text-body`/`text-caption`, which this monorepo does not define (Tailwind dropped them silently). Replaced with built-in `text-sm`/`text-xs`, including the `max-md:before:` card captions. RED first: the new Storybook assertions failed with desktop cell `16px` (expected 14px) and phone `td::before` caption `14px` (expected 12px); GREEN after the class change.
2. Phone coverage: `NotionTable.stories.svelte` now has phone stories at 320×568 and 390×844 using the public imports. They check the card's visible order (selection, title, status, label/value fields, footer metadata, footer snippet, row actions), 16px card padding and 14px field gap, 12px captions against 14px values and the 17px title, no page horizontal overflow, and a 44×44 caller-owned selection label that toggles the row when clicked away from the box. A separate story checks that a hidden `footer` column is absent while the footer snippet keeps its divider. Order/spacing and the hidden-footer story passed on first run, so they are characterization coverage, not RED-first.
3. The story and README selection now use a 44×44 `<label>` wrapper; selection state stays with the caller.
4. Docs: README provenance now says the English defaults were kept from TP (`labels.ts` unchanged), not translated. The catalog note about the persistent-search change moved to the `DataViewToolbarOperators.stories.svelte` row.
5. Peer: `@platform/svelte-ui` `peerDependencies.svelte` `^5.0.0` -> `^5.20.0` (`$props.id()`). `bun install --lockfile-only` changed exactly one `bun.lock` line (that workspace's peer entry). `bun install --frozen-lockfile` then reported "no changes"; no resolved package version changed. `bun.lock` sha256 before `1e7941af…`, after `a7040d72…`.

Re-run after corrections: package `bun test` 33/33; `svelte-check` 0/0; `svelte-package` OK; full Storybook 11 files / 84 tests (82 + 2 new phone stories). Root `bun run check` and `bun run build` exit 0. Root `bun run test` exit 0 with `DATABASE_URL`/`TEST_DATABASE_URL=postgres://test:test@127.0.0.1:55459/test` (owned PG16, already migrated by root; no schema change here): API 29 suites / 56 tests passed (1 skipped), Web regression passed, Storybook 84/84. Logs: `/tmp/r6-monorepo-opus-fix/{check,build,test}.log`. An earlier root run without the DB env failed on isolated-DB connections; that was environmental and the corrected run is the one reported. The root `test` script does not run `packages/svelte/ui` bun tests; those were run separately above.

Still open / not claimed: dependency audit (35 vulns: 5 critical, 30 high) is in unchanged resolved deps and stays with root/PR CI and the user's exception decision; no audit, workflow or security-dependency change was made. No real-device/iOS keyboard check, no CUA/manual UI, no deployment, UAT or downstream pin.

## Current hold — R7 user UAT corrections (2026-11-27)

Independent Opus closure: GO for the saved generic code after typography/phone-story/selection-target/docs/peer-range corrections. Package33pass, Storybook84pass, root check/test/buildpass; Web0errors15baselinewarnings. The required typography assertions were observed RED at16px desktop/14px phonecaption then GREEN at14px/12px; remaining layout checks characterize existing behavior. Svelte peer minimum^5.20 is mirrored in one workspace lockfile metadata line; resolved package records identical to c7783e0. Audit35(5critical/30high) matches current baseline; prior PR25 exception does not extend here. No audit bypass or dependencies upgrade.

Before integration, the user now requires three visual corrections: phone calendar to the approved design, PC search/filter/sort/More in a single right-aligned group, phone batch-selection entry inside More. Talent Pool R7 wireframe is being prepared for explicit user review. This saved source is not R7 approval or delivery. Keep all uncommitted work; no PR/merge/downstream pin/deploy/npm publication or branch/worktree cleanup. Next: obtain R7 wireframe approval, implement source corrections, re-review/retest changed scope, then resolve concrete PR audit decision and authoritative import.

2026-11-27 R7 wireframe explicit approval received:「R7 通過，開始實作」. The exact approvedHTML is TP sourceSHA256ecc4729d5d994301f65c6e215ba3446d884f326c6ce8c87b09444e49415309cb. Root is implementing corrected TalentPool App now; mandatory actual-compiled phone/PC parity BEFORE deployment +realDev recheck. Resume generic promotion/adoption AFTER corrected TalentPoolDev is deployed, preserving user Dev-first ordering. This approval does not extend the old PR25-only audit exception and is not consumerDev UAT.

## R7 generic promotion (2026-11-27, Sonnet; review pending, uncommitted)

Prerequisite met: TP Dev PR64 merged `b68e94b` (source `4c49510`, docs `8daed68`), deployment `01f1ea4faa091af4be8f4c7638bf6ed9` SUCCEEDED. Approved wireframe `layout-r7-review.html` (sha256 `ecc4729d…9cb`). R6 history above is preserved, including the R6 typography/selection/peer fixes.

Generic delta from TP (`git diff 64f5a17 4c49510 -- packages/ui`): only `data-view-toolbar.svelte` and `notion-table.svelte` changed. Ported (layout classes only): non-wrapping, right-aligned control row (removed `sm:flex-wrap`); search wrapper `data-slot="data-view-toolbar-search"` bounded to 300px (min 144px) on `md`+ and `flex-1 basis-0` on phones; search `Input` `max-md:h-11`; `actions` wrapper does not wrap; applied chips right-aligned on `md`+. Evaluated, NOT promoted: the TP-only `leading` snippet (not requested; additive API can wait for a consumer), NotionTable selection-beside-title (spec keeps the R6 card layout; phone batch entry stays a caller-owned More command), calendar and TP theme CSS. Query/operator code, labels, `toggle` defaults and public props are untouched.

TDD: new story `Persistent controls right-align as one group on PC and keep one 44px row on phones` (DataViewToolbar.stories.svelte). RED first, log `/tmp/r7-monorepo-implementation/red.log`: `search bounded at 1280: expected 1015.7 to be <= 300.5` (search stretched). GREEN after the toolbar change. Limits: the phone 320/390/430 assertions (one row, 44px search/Filter/Sort, no page overflow) were not isolated as RED — the run stopped at the first failing PC assertion, so they are unproven-RED/characterization. The existing `Persistent localized search` story asserted the superseded ">50% of toolbar" width; it was changed to the bounded R7 assertion. Toggle/capacity/operator stories were not edited and still pass.

Results (logs in `/tmp/r7-monorepo-implementation/`): package `bun test` 33/33; `svelte-check` 0/0; `svelte-package` OK; full Storybook 11 files / 85 tests; root `bun run check` and `bun run build` exit 0; root `bun run test` exit 0 with `DATABASE_URL`/`TEST_DATABASE_URL=postgres://test:test@127.0.0.1:55459/test` (existing owned container `tp-ui-r6-monorepo-pg`, no schema change; API 29 suites / 56 tests, 1 skipped). `bun install --frozen-lockfile`: no changes; `bun.lock`/`package.json` diff is still only the R6 peer line. No audit/workflow change; the audit (35: 5 critical, 30 high) is unchanged baseline and the PR25 waiver does not apply here.

Not done / not claimed: no manual or CUA inspection, no real-device check, no PR/CI, no user UAT, upstream not merged, no Databricks pin.

## R7 review fixes (2026-11-27, Opus; independent review REQUEST CHANGES)

This supersedes the R7 section's "NotionTable selection-beside-title evaluated, NOT promoted" and its "toggle unchanged" wording. The earlier text above is kept as history.

- R1, caller action size: root's first CUA evidence (`TP/TP-UI-01-R7-review/monorepo/toolbar-320.png`) and the review found the story's caller "View mode" button at 84×24 on a 320px phone. The R7 story's 44px loop skipped it (`controls.slice(1, 3)`). RED: extending the loop to `controls.slice(1)` failed with `expected 24 to be >= 44` (`/tmp/r7-monorepo-fix/r1-red.log`). GREEN: only the story's caller button got `min-h-11 min-w-11` (`md:min-h-8`). The library still only wraps `actions`. The README now says the caller owns the 44×44 target and recommends one More trigger on phones. The phone control gap is now 8px (`max-md:gap-2`, matching TP), with desktop unchanged; Capacity and Operators stories still pass.
- R2, NotionTable selection beside the title (ported from TP `4c49510`, narrowed): `selectBesideTitle = leading.length === 1 && view.some(c => c.mobile === 'title')`. When true, the leading utility uses `max-md:absolute max-md:start-2.5 max-md:top-3 max-md:before:hidden`. The `before:hidden` is needed because the empty caption pseudo plus the 12px gap pushed the 44px label past the title text. The title gets `max-md:min-h-11 max-md:ps-10 max-md:pt-2.5`, the status `max-md:ps-10`, and the `tr` `max-md:relative`. Otherwise the R6 `max-md:order-1` stacked row stays. Desktop, the select-all header row, footer, prefs, typography and public props are unchanged.
  - RED: the updated phone story failed with `selection beside title at 320px: expected false to be true` (`r2-red.log`). The first GREEN attempt failed `expected 83 <= 73.5` until `before:hidden` was added.
  - GREEN at 320/390/430: the target overlaps the title row, ends before the title text, stays inside the card border, is 44×44, and toggles when clicked in the label padding.
  - The story and README labels dropped the phone `-ms-3.5`.
  - Fallback stories (two leading utilities; no title column) passed before the change, so they are characterization. A mutation to the ungated TP form (`leading.length > 0`) failed both (`r2-mutation.log`), so they do catch the naive port. The source was restored and rebuilt.

Results (`/tmp/r7-monorepo-fix/`, exit codes captured separately): `bun install --frozen-lockfile` 0 (no changes); package `bun test` 0 (33/33), `check` 0 (0/0), `build` 0; full Storybook 0 (11 files / 87 tests = 85 + 2 fallback stories); root `check` 0, `build` 0; root `test` 0 with the owned PG16 `tp-ui-r6-monorepo-pg` at 127.0.0.1:55459 (`DATABASE_URL`/`TEST_DATABASE_URL`; no migration; API 29 suites / 56 tests, 1 skipped; Storybook 87/87). The `bun.lock`/`package.json` diff is still only the R6 peer line. The audit (35: 5 critical, 30 high) is the unchanged baseline; nothing was bypassed and no workflow changed.

Pending / not claimed: root CUA after this fix, independent review closure, PR/CI, upstream merge, Databricks pin, user Dev UAT; no real-device check.

## Root CUA after review fixes (2026-11-27)

Actual Storybook built from the fixed library was checked at320/390/430/1280/1440. Toolbar: all4 phone controls44px high, filter/sort44wide, same row and no page overflow; PCsearch300px and complete group flushright. Table: 44×44 selectionlabel insidecardbesidetitle/status, longtitlewrap, keyboardSpace selected1, desktop remains table, no page overflow across5sizes. Multiutility/no-title fallback cases are covered by the existing Storybook tests and mutationcheck, not claimed manually tested. Evidence outsideGit: TalentPool root outputs/TP-UI-01-R7-review/monorepo/{manual-parity.md,final-toolbar-*.png,final-card-*.png,*-measurements.json}. Viewport reset.

The demo supplies selection all the time; real consumers control More→batch mode and capabilities. Story root16px plus module tbody16px gives cardx32 here; the consuming App must avoid nested cards/extra padding and qualify its own page against R7 before deployment. No consumer-App/physical-device/DevUAT/audit waiver claim. Production and cleanup remain gated. Independent closure and concrete upstreamPR/CI are next; audit35(5critical/30high) remains visible.

2026-11-27 independent Opus closure (session73d7df35) GO for full source/storyscope after R1/R2 fixes; all runtime/story hashes match frozen fix (only root CUA task note added). Package33, fullStorybook87, rootcheck/build/test passed; source and contract tests frozen. Audit35(5critical30high), same33advisoryIDs and unchanged resolved graph; Svelte peer metadata^5.20 only. Opening concrete upstreamPR/CI next, no priorPR25 exception reuse. Latest user asked to continue next TalentPool milestone (Headcount); this is authorization to progress that work, not an audit exception or explicit newDevUAT confirmation. Preserve allbranches/worktrees and no main/Production.
