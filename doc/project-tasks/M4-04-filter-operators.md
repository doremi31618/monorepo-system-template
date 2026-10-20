# M4-04 — Data view toolbar: opt-in operators and repeated rules

- Status: Review — independent code review approved; non-audit checks passed, one-time audit exception authorized
- Actor/roles: Codex coordinator (Owner/Integrator); Claude Code CLI Sonnet implementation,
  Opus correction and separate read-only Opus Reviewer; no direct dev/main edits
- Branch/worktree: `codex/M4-04-filter-operators` at
  `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/M4-04-filter-operators`
- Dev PR: https://github.com/doremi31618/monorepo-system-template/pull/24
- Main PR/deployment: pending; no main merge or release before integrated App Dev UAT
- Base: `origin/dev` `b611268`; consumer pin `a1c4e13` (Databricks Pipeline M4-04)
- Spec: [Data View Toolbar](../system-spec/architecture/data-view-toolbar.md) §3.1
- Scope: generic `@platform/svelte-ui/data-view-toolbar` only. The package knows no consumer field types, API, limits or operator names; the consumer owns persistence (sessionStorage) and does not use the URL codec.
- UI Module Catalog: reviewed and updated — [catalog/usage audit](../system-spec/architecture/ui-module-catalog.md)
  records the public module, current Web imports and new operator/capacity Storybook adoption.

## Final independent review checkpoint

Separate read-only Opus Reviewer approved the frozen tree after corrections1–3 and the capacity
fix:23/23 unit tests, package check0 errors/0 warnings, package build, and22 focused operator/
capacity stories twice in Chromium. The full69-story run was the implementer's verification,
not repeated by that Reviewer. Coordinator also ran dependency boundary and graph checks:
22 workspaces, no cycles or boundary violations. No dependency or lockfile change.

Non-blocking observation: re-adding an existing non-repeat property from the picker retains
the old replace behavior (its caller ID may be dropped); editing its chip preserves its ID.
The Chat consumer uses repeated custom properties with stable IDs. Safari, real iOS,
on-screen keyboard, full repository CI and integrated App Dev acceptance remain pending.

## Public interface added (all optional; existing callers unchanged)

- `DataViewFilterOperator` is now `DataViewBuiltInFilterOperator | (string & {})` (extensible). `DataViewBuiltInFilterOperator` is the old closed union.
- `DataViewOperandKind = 'none' | 'single' | 'multi'`; `DataViewOperatorMeta { operand; label? }`.
- `DataViewProperty`: `operatorMeta?: Partial<Record<string, DataViewOperatorMeta>>`, `allowRepeat?: boolean`, `maxRules?: number` (only with `allowRepeat`). Operators without metadata keep the built-in behavior (`isAnyOf` multi, everything else single, `between` two values).
- `DataViewProperty.normalizeText?: (raw: string) => string` — normalizes a single-value text operand (built-in input or custom `filterEditors` `setValue`) for both Confirm validation and the committed value; an empty result is blank. Omitted → `raw.trim()` (old behavior). `between` always trims both values. The package ships no whitespace rules; the consumer supplies its domain-specific trim (added in the second review correction below).
- `DataViewFilterRule.id?: string` — stable identity, unique per property; the toolbar assigns one to new rules of `allowRepeat` properties and keeps the existing id of any edited rule. Unary rules keep `value: ''`.
- `DataViewFilterEditorContext.operand: DataViewOperandKind` — tells a custom `filterEditors` snippet whether the operator is `none`, `single` or `multi` (added in review corrections; the toolbar always supplies it).
- Helpers: `resolveOperandKind`, `resolveOperatorLabel`, `upsertDataViewFilter`, `removeDataViewFilter`, `canAddDataViewFilter`.
- `writeDataViewQuery(current, query, properties = [])`: the third argument lets unary rules be written and applies each property's `normalizeText` to single string validity; without it behavior is unchanged. `parseDataViewQuery` accepts unary (`value === ''`), repeated rules (`allowRepeat`, bounded by `maxRules`) and `id`; see the identity contract below for duplicate or missing ids.
- Labels: `cancelFilter` (default `Cancel`); `operators` is `Record<built-in, string> & Record<string, string>`.
- `searchMode` also accepts `'hidden'` (from the consumer patch below).

## Behavior

- Unary operator: no value editor; Confirm is enabled; commits `value: ''`.
- Unary operator on an `enum` / `relation` property never calls `loadOptions` (neither on selection nor when editing its chip).
- Multi operator (any key whose meta is `multi`, plus built-in `isAnyOf`): multiple options toggled with `aria-pressed` buttons; commits `string[]`. For a custom `filterEditors` snippet the toolbar reads `selectedValues` (set through `setSelectedValues`) for both Confirm enablement and the committed value, and pre-fills `selectedValues` when editing. Boundary: a `multi` operator on a non-choice property **without** a custom editor gets the plain single input, whose value is not a selection, so Confirm stays disabled — such properties must supply a `filterEditors` snippet.
- Repeat-enabled property: each Confirm appends a rule, editing replaces only the edited rule in place, remove drops only that rule; chips are keyed by `id`; remove label is `Remove filter: <summary>`. Non-repeat properties keep one rule each, the old replace-and-append ordering and the old `Remove <Property> filter` label.
- Draft only: Confirm commits, Cancel / Escape / outside-close discard. Focus returns to the Add filter trigger, or to the chip that opened the editor, through `onCloseAutoFocus` (prevented default + explicit target) on both the desktop Popover and the mobile Drawer; the sort Popover/Drawer return focus to the Sort button the same way.
- Crossing the mobile breakpoint while the editor is open swaps Popover ↔ Drawer without closing: the draft is kept and the chip restore target is not consumed until a real close.
- `searchMode='persistent'` stays always-visible on desktop (Escape on an empty box keeps it); on mobile it renders as a toggle, and Escape on an empty box collapses it back to the Search button.
- Long (100 character) options and chips wrap; the popover is capped to the viewport width.
- Async `loadOptions`, abort, paging, sort and search code paths are untouched.

## Repeated-rule identity contract

- Matching (`upsertDataViewFilter` editing, `removeDataViewFilter`) is by object reference first; a copy matches only through a **unique** `(property, id)` pair. Ids are property-scoped, so equal ids on different properties never affect each other. A copy that is id-less, unmatched or ambiguous (two siblings share the id) changes nothing — `filters` is returned as-is, and the toolbar then emits nothing.
- With `allowRepeat`, `upsertDataViewFilter` without `editing` appends; with an `editing` rule that is no longer in the list it is a no-op (it never appends). Current boundary: a parent that hands the toolbar **new, id-less** repeated rule objects while an edit is open loses that edit (no change, no emit); there is no value-based matching. Stable ids are the supported way to survive rehydration.
- `parseDataViewQuery` keeps every valid repeated rule (still bounded by `maxRules`): an `allowRepeat` rule with a missing or duplicate id gets a deterministic `<property>-<n>` id that no incoming rule of that property claims, so re-parsing the same URL yields the same ids. Non-repeat rules keep a unique id and drop a duplicate one.
- New toolbar rules get the lowest `<property>-<n>` id not used by **any** rule in the current query (all properties), so ids stay unique after rehydration (no time/sequence ids) and an app-supplied cross-property id such as `note-1` cannot collide. Parse-assigned ids remain property-scoped (unchanged).
- Editing keeps the edited rule's existing id on every property (repeat or not); only new repeated rules get a generated id. `filterEditing` and `filterProperty` are always set together from the same rule and reset together (choosing another property resets the edit), so a kept id can never move to a different property.
- Chip `{#each}` keys are `[property, id ?? null, occurrence]`, where occurrence counts rules with the same property and id. They are collision-safe even for controlled queries with duplicate or cross-property ids, and an id-less non-repeat rule keeps its chip (and focus) when an edit moves it to the end.

## Baseline port provenance

Consumer `vendor/svelte-ui` (pin `a1c4e13` + patches `e75770a` "Restore notion-like mobile filters", `101d026` "Anchor mobile drawers to viewport") was diffed against `origin/dev`; only two files differed. Ported:

- `ui/drawer/drawer-content.svelte`: byte-identical to the consumer file.
- `ui/data-view-toolbar/data-view-toolbar.svelte`: the consumer's controls markup (icon-only mobile buttons with `ListFilterIcon`, no-wrap mobile row, `searchMode='hidden'`, mobile open buttons instead of `Drawer.Trigger`). Because those buttons no longer use `Drawer.Trigger`, explicit focus restoration was added for the mobile filter and sort drawers.

No unrelated `main` components or search APIs were imported; no dependency or lockfile changes.

## Tests and commands

RED then GREEN, one behavior at a time (initial implementation):

- `bun test ./packages/svelte/ui/tests` — 16 pass (new `data-view-operators.test.ts`: operand metadata/labels, unary + repeat codec, upsert/remove/maxRules; existing query and drawer contract tests unchanged).
- New Storybook interaction stories `apps/storybook/src/stories/DataViewToolbarOperators.stories.svelte` (unary, multi, cancel/Escape + focus, repeat edit/remove independence, mobile drawer with a 100-character option). They failed first on the missing operator label.
- `bun install --frozen-lockfile` (this worktree only); `bun run --filter @platform/svelte-ui build`, `bun run --filter @platform/svelte-service-ui build` (needed by Storybook); `cd apps/storybook && bun run test` — 52 pass (9 files, headless Chromium). The first run after a fresh install failed once on Vite dependency re-optimization and passed on rerun.
- `cd packages/svelte/ui && bun run check` — 0 errors, 0 warnings; package `build` succeeds.

## Review corrections (2026-10-20)

Independent review raised six findings. Each was corrected test-first through the public seam (package helpers via `bun test`, toolbar via Storybook interaction stories in `DataViewToolbarOperators.stories.svelte`). Authored edits were made with `apply_patch`. Method deviation: some temporary mutation-check reverts in this round were restored with `cp` from a saved copy rather than `apply_patch`; the earlier statement that all edits used `apply_patch` was inaccurate.

| # | Finding | RED observed | GREEN |
|---|---|---|---|
| 1 | `sameRule` matched id across properties; parse kept duplicate ids; chip keys collided | 5 new `bun test` cases failed (cross-property removal/edit, same-property sibling targeting, ambiguous copy, parse normalization). Stories `Duplicate ids edit and remove only the targeted sibling` and `New rule ids stay unique after rehydration` failed with Svelte `each_key_duplicate` (the latter with `Date.now` stubbed to show the old `rule-<time>-<seq>` collision) | `findRuleIndex` (reference, then unique property-scoped id), parse id normalization, `createDataViewRuleId`, collision-safe chip keys |
| 2 | Mobile focus restoration via `tick` after open-state effects; breakpoint swap | Story `Open chip draft survives desktop and mobile breakpoint changes` (Vitest `page.viewport` 1024×768 → 375×667 → 1024×768 with a chip draft open) failed: final focus on Add filter instead of the chip | `onCloseAutoFocus` on Popover and Drawer for filter and sort, guarded by `filterOpen`/`sortOpen`; `*WasOpen` effects and trigger `bind:ref`s removed (triggers found via `data-toolbar-trigger` under a single root ref). Mutation check: removing the `filterOpen` guard makes the story RED again (focus on Add filter) |
| 3 | `multi` ignored for custom editors / non-choice properties | Story `Multi operand drives a custom editor's selected values` failed (`operand` missing). Mutation check: reverting only the `canConfirm` multi branch fails the story (Confirm disabled) | `operand` in editor context; `canConfirm` / commit / edit pre-fill use `selectedValues` for `multi` |
| 4 | Unary enum/relation issued `loadOptions` | Story `Unary relation operator does not load options` failed: 2 loads, expected 0 | Loads only when operand is not `none` (selection and chip edit) |
| 5 | Persistent search could not collapse on mobile | Story `Persistent search collapses on mobile and stays on desktop`: the first run failed on a leftover `pointer-events: none` from the previous story (test hygiene, fixed by waiting for close); mutation check with the fix reverted fails on the intended assertion (searchbox still present after Escape) | Escape-on-empty collapses when mobile; desktop persistent unchanged (asserted after resizing back) |
| 6 | Editing an id-less repeated rule after the parent replaced refs appended a duplicate | `bun test` `does not append when an edited id-less repeated rule is no longer in the list` failed | `upsertDataViewFilter` no-op for a missing `editing` rule; toolbar skips emitting unchanged filters. Story `Editing an id-less repeated rule after rehydration never appends` protects it (0 emits, both originals intact) |

Additional coverage, not a RED: `Mobile sort drawer returns focus to the sort button` passed before and after the change, and also passes with the sort `onCloseAutoFocus` removed (bits-ui's default already returns focus to the trigger), so it guards the outcome, not the mechanism.

Results after corrections (this worktree, existing dependencies, no install):

- `bun test ./packages/svelte/ui/tests` — 21 pass, 0 fail (3 files).
- `cd packages/svelte/ui && bun run check` — 0 errors, 0 warnings; `bun run build` succeeds.
- `cd apps/storybook && bun run test` — 60 pass (9 files, headless Chromium), run twice consecutively, both green; no flakes observed. The operator story file alone: 13 pass.
- `svelte-check` on `apps/storybook`: 2 errors, both in the untouched `UiLibrary.stories.svelte`; none in the operator stories.
- Test hygiene note: bits-ui keeps `body { pointer-events: none }` briefly while an overlay closes; stories that end by closing an overlay now wait for it to unmount, and the breakpoint story waits for the lock to clear before its next click.

## Review correction 2 (2026-10-20): text operand normalization

Finding: Confirm validation used JS `.trim()` and the committed single text value was `.trim()`ed. JS `trim` treats U+FEFF as whitespace, so a consumer whose approved text comparison uses a different edge-whitespace set (where U+FEFF is not blank) could not Apply a FEFF-only operand, and leading/trailing FEFF was silently removed, changing the predicate.

Fix: opt-in `DataViewProperty.normalizeText` (see Public interface). Confirm uses `Boolean(normalizeText(value))` and commits `normalizeText(value)` for ordinary single text operands, including custom editors. Unchanged: default trim, `between` (trims both values), choices/multi/unary, search trim, async options, repeated rules. The custom editor context still exposes the raw `value` the editor set. All edits and the temporary mutation/restore in this correction used `apply_patch` only.

New stories in `DataViewToolbarOperators.stories.svelte` (they compare an escaped exact rendering of the committed value, because text matchers collapse FEFF as whitespace):

| Story | Covers | Before fix |
|---|---|---|
| `Text operand keeps the default trim without a normalizer` | no `normalizeText`: `'  foo  '` → `"foo"`; spaces-only and FEFF-only keep Confirm disabled | pass (regression guard) |
| `Identity normalizer keeps FEFF operands exactly` | `normalizeText: raw => raw`: FEFF-only Applies as `"﻿"`; `"﻿a﻿"` kept exactly; editing that repeated rule pre-fills the exact value and re-Confirm loses no characters | RED: Confirm disabled |
| `Custom normalizer disables blank text and commits its result` | normalizer stripping ASCII/C0 edge whitespace (`\t\n\v\f\r`, space, `\x1c`–`\x1f`, `\x85`): `' \t\x1f '` disables Confirm; `' ﻿x\t'` commits `"﻿x"` | RED: Confirm enabled (`\x1f` not blank under JS trim) |
| `Custom editor single text uses the normalizer; between keeps trim` | custom `filterEditors` snippet: FEFF-only commits `"﻿"` and re-opens with the exact value; `between` `' a '`/`' b '` commits `["a","b"]` | RED: Confirm disabled |

Mutation check: reverting only the commit expression to `filterValueDraft.trim()` (validation kept) fails the three new normalizer stories on the committed value; restored with `apply_patch`.

Results (this worktree, no install):

- Operator stories alone: RED 3 failed / 14 passed → GREEN 17 passed.
- `bun test ./packages/svelte/ui/tests` — 21 pass, 0 fail.
- `cd packages/svelte/ui && bun run check` — 0 errors, 0 warnings; `bun run build` succeeds.
- `cd apps/storybook && bun run test` — 64 pass (9 files, headless Chromium).
- `svelte-check` on `apps/storybook`: the same 2 pre-existing errors in untouched `UiLibrary.stories.svelte`; none in the operator stories.
- Not run: real browsers other than headless Chromium, consumer suites.

## Review correction 3 (2026-10-20): codec normalizer, edited ids, chip keys

Independent re-review (21 unit / 64 Storybook passing) found three issues. Each was corrected test-first. All edits in this round, including test fixes, used `apply_patch` only. No mutation checks were run in this round.

| # | Finding | RED observed | GREEN |
|---|---|---|---|
| 1 | URL codec `hasValue` used JS `trim`, so `writeDataViewQuery`/`parseDataViewQuery` dropped FEFF-only text that `normalizeText` accepts | `bun test` `honors normalizeText for single text validity and keeps the exact value` failed: the FEFF-only rule was missing from the written params | `hasValue(value, property)` uses `property.normalizeText ?? trim` for string values in both write and parse. The value is kept exactly as before (never normalized), and arrays are unchanged. The same test checks that without a normalizer the old trim behavior holds (FEFF-only dropped, edge-FEFF kept) and that a normalizer-blank `' \t '` rule is dropped |
| 2 | `commitFilter` attached an id only with `allowRepeat`, so editing a non-repeat rule with app id `app-7` lost it | Story `Editing a non-repeat rule keeps its app id` failed: emitted ids `-`, expected `app-7` | `id = filterEditing?.id ?? (allowRepeat ? createDataViewRuleId(...) : undefined)` |
| 3 | Id-less chip keys used the overall array index, so editing the first non-repeat rule (moved to the end by the legacy order) destroyed its chip and focus went to Add filter | Story `Editing the first id-less non-repeat rule keeps its chip and focus` failed: the originally clicked chip was disconnected (`isConnected` false). The first run failed on a test bug (`toBeConnected` is not a matcher here) and was fixed before the real RED | Keys are `[property, id ?? null, occurrence within (property, id)]`. The story also asserts the legacy order `owner…|title…` |
| 3b | `createDataViewRuleId` only avoided ids of the same property | `bun test` `new rule ids avoid every current id, including other properties` failed: got `note-1` while `status` held `note-1` | Avoids every id in `filters` |

Property-switch boundary: no change needed (see the identity contract above). Choosing a different property calls `resetFilterEditor`, which clears `filterEditing`, so a kept id is never written onto another property's rule. Valid conditions are not dropped or weakened.

`normalizeText` toolbar integration is unchanged. The four normalizer stories from correction 2 still pass.

Results (this worktree, no install):

- `bun test ./packages/svelte/ui/tests`: RED 21 pass / 2 fail → GREEN 23 pass, 0 fail.
- Operator stories alone: RED 2 failed / 17 passed → GREEN in the full run.
- `cd packages/svelte/ui && bun run check`: 0 errors, 0 warnings. `bun run build` succeeds.
- `cd apps/storybook && bun run test`: 66 pass (9 files, headless Chromium).
- `svelte-check` on `apps/storybook`: the same 2 pre-existing errors in untouched `UiLibrary.stories.svelte` (Accordion `collapsible`, Select type). None are in the operator stories.

## Capacity regression (2026-10-20): 54 properties

Risk: a consumer allows 50 custom fields plus 4 built-ins, so the property picker can hold 54 buttons. The desktop filter `Popover.Content` had only a `max-w` cap and the picker grid had no max height or scroll, so late fields could end up past the viewport. The mobile Drawer already had `max-h-[85dvh]` and a scrolling body, but no test proved it. Test written first. All edits in this round used `apply_patch` only. No mutation checks were run.

New story file `apps/storybook/src/stories/DataViewToolbarCapacity.stories.svelte` (real headless Chromium, Vitest `page.viewport`). It uses 4 built-ins and 50 `allowRepeat` text fields with unique 100-character labels and a consumer-style `normalizeText`. Each story opens Add filter and waits for the overlay rect to sit inside the viewport. It then finds the 50th field's real scroll container: the nearest ancestor whose computed `overflow-y` is `auto`/`scroll` and whose `scrollHeight > clientHeight`. It checks that container is inside the overlay. Next it Tabs through the focus trap until the 50th field has focus, with no `scrollIntoView`. It then checks that field's bounding rect is inside the container and the viewport, `scrollTop > 0`, and there is no horizontal overflow in the overlay or the page. Finally it presses Enter, picks `contains`, types a value, and checks the input, Cancel and Confirm rects are inside the viewport. It confirms and checks focus goes back to Add filter.

| Story | Viewport | RED (before fix) | GREEN |
|---|---|---|---|
| `Desktop popover keeps the 50th custom field reachable` (also adds a second rule for the same field: repeat + normalizer `' one '` → `"one"`) | 1024×768 | failed: `overlay: 38,1024,4238,736 not inside 0,1024,768,0` (popover about 4200 px tall) | pass |
| `Phone portrait drawer keeps the 50th custom field reachable` | 375×667 | pass (regression guard) | pass |
| `Phone landscape drawer keeps the 50th custom field reachable` | 667×375 | pass (regression guard) | pass |

Fix (filter Popover only; the sort popover, drawer, consumer and shared popover styles are unchanged): `Popover.Content` gets `max-h-(--bits-popover-content-available-height)`, and the editor renders inside `<div class="-m-1 min-h-0 overflow-y-auto p-1">`. The padding keeps the 3 px focus rings from being clipped, and the sticky Cancel/Confirm footer now sticks inside that scroll body. The variable comes from local bits-ui `2.19.0`: `getFloatingContentCSSVars('popover')` maps it to `--bits-floating-available-height`, which the floating-ui `size` middleware sets (default `collisionPadding` 0). Field count, label length, search and all other behavior are unchanged.

Results (this worktree, no install):

- Capacity stories alone: RED 1 failed / 2 passed → GREEN 3 passed.
- `bun test ./packages/svelte/ui/tests`: 23 pass, 0 fail.
- `cd packages/svelte/ui && bun run check`: 0 errors, 0 warnings. `bun run build` succeeds.
- `cd apps/storybook && bun run test`: 69 pass (10 files, headless Chromium).
- `svelte-check` on `apps/storybook`: the same 2 pre-existing errors in untouched `UiLibrary.stories.svelte`. None are in the new story.
- Limitations: headless Chromium viewport emulation only. There was no Safari, iOS, real device or on-screen keyboard check. Until floating-ui has measured, the variable is `undefinedpx` (an invalid value), so the cap takes effect from the first positioned frame. The popover is capped to the space below (or above, after a flip) its trigger with no edge padding.

## Remaining review / browser needs

- Independent review and re-review of the corrections are complete (see final checkpoint above).
- Storybook mobile stories use the `mobile1` viewport or Vitest `page.viewport` resizing in headless Chromium only; no real device, Safari or iOS check was done, and the `100dvh` drawer anchoring from the consumer patch was only verified through those stories.
- Not run: web/API suites, `bun run lint`, Storybook build, a11y audit.
- Coordinator still must merge the reviewed Dev PR after required CI, then import the reviewed package into the consumer snapshot and update `svelte-ui.snapshot.json`.

## CI blocker (2026-10-20)

PR #24 head `005a482` failed the required `verify` job at `bun run deps:audit`:
[CI run](https://github.com/doremi31618/monorepo-system-template/actions/runs/39362972542).
The audit reports 23 high/critical advisories (3 critical, 20 high), covering existing
mail/API/editor/build dependencies. This Work Item changes no dependency manifest or
lockfile; comparison with base `b611268` confirms only the listed UI, tests and documentation
files changed. No security exception, audit suppression, dependency upgrade, Dev merge or
consumer import has been performed. The user explicitly chose **not** to upgrade dependencies
and to preserve progress / defer integration on2026-10-20. No dependency-remediation work
is authorized. Local feature verification does not replace
the required CI gate, and main/Production remain untouched.

### Resumption / one-time exception

On2026-10-20, after clarifying this is the shared UI upstream repository rather than the
App repository, the user explicitly said「好，那忽略這次結果繼續推進」. This revokes the
integration hold and accepts only the dependency-audit result for PR#24 as a one-time
exception. It does not authorize dependency upgrades, permanent workflow/audit changes,
false green check statuses, or bypassing typecheck/tests/build/review. The original failed
audit remains visible. Verify the remaining workflow commands on the frozen branch before
any Dev merge; retain branch/worktree until integrated App Dev acceptance. Main/Prod
remain gated by the existing release workflow and explicit Dev acceptance.

### Non-audit workflow verification

Separate verification executor ran the remaining workflow commands locally at `776e0e6`
against PostgreSQL16.14 in an owned container bound only to127.0.0.1:55459 (not the
protected application DB on5432 or the capacity DB on55458). Frozen install, explicit
test-DB migration, dependency boundaries/graph, root `check`, `test`, `build` all passed.
UI package check/build and23 unit tests passed. Root test includes runtime-task4,
service-ui2, API56 passed/1 skipped (29 suites passed/1 skipped), Web admin regression,
and69 Chromium Storybook tests in10 files. Web check:0 errors/15 existing warnings.
Nonblocking `deps:report` exits1 for three existing unused-export entries, as the CI
workflow allows; manual Storybook typecheck was not rerun (its two baseline errors
remain disclosed). The GitHub job itself still fails at the accepted audit and skips
later steps: **do not label the GitHub run green**. No dependencies or workflow changed.
This documentation-only update does not alter the verified package tree.

## Follow-up bugfix (2026-10-20): long option labels overlap in the default choice editor

Report (coordinator, real in-app WebKit at 667×375): a consumer `enum` property with a `multi`
operator and 100 options with 100-character Chinese labels, default choice editor (no custom
`filterEditors`). After choosing Contains any, all 10 visible option buttons were 32 px tall
with the text spilling over the other options; the options grid had 10 rows × 32 px under
`max-h-64` (256 px); page `scrollWidth` 1705 > 667. The Drawer rect and footer were correct.
The generic field picker (50 long names) passed. Branch fast-forwarded to reviewed Dev `95b2b75`
after the PR #24 merge. All edits and the mutation reverts/restores in this round used absolute-path
`apply_patch` only.

Root cause (local CSS, reproduced in headless Chromium too, so not WebKit-only):

1. The options list is `grid max-h-64 overflow-y-auto` with implicit `auto` rows. Each option
   button has an explicit `min-h-8`, so each row's base size is 32 px. Grid track sizing
   (CSS Grid §12.6, Maximize Tracks) does not grow rows past the container's `max-height`. Ten
   rows (10 × 32 + 9 × 4 gap = 356 px) already exceed 256 px, so every row stays at 32 px. The
   stretched button is 32 px, and its wrapped label overflows into the next options. The field
   picker has no `max-height` on its grid, which is why it passed.
2. `break-words` (`overflow-wrap: break-word`) does not lower the min-content width. An unbroken
   Latin label therefore sets the grid column wider than the list (Chromium: button 795 px in a
   343 px list).

Fix (options list only; labels are not truncated and the caps, paging and UX are unchanged): the
options grid gets `auto-rows-max`, so rows are sized by content. The option button replaces
`break-words` with `[overflow-wrap:anywhere]`. The property picker, operator list, Drawer,
Popover and consumer are unchanged.

New stories in `DataViewToolbarCapacity.stories.svelte` (Vitest `page.viewport`). Each uses a
`multi` enum with 100 options whose labels are 100 characters:

| Story id (`ui-library-data-view-toolbar-property-capacity--…`) | Labels | Viewport |
|---|---|---|
| `phone-portrait-drawer-lays-out-100-long-cjk-options` | CJK | 375×812 |
| `phone-landscape-drawer-lays-out-100-long-cjk-options` | CJK | 667×375 |
| `phone-portrait-drawer-lays-out-100-unbroken-latin-options` | unbroken Latin | 375×812 |
| `phone-landscape-drawer-lays-out-100-unbroken-latin-options` | unbroken Latin | 667×375 |

Each story checks that every rendered option's text range sits inside its own button, that no
option overlaps the one above, and that options stay within the list width with no horizontal
scroll. It also checks that the Drawer is inside the viewport and the page has no horizontal
overflow. It Tabs (with lazy reveal) to the 100th option, checks that option is inside the list
and the viewport, and selects it with Enter. It then checks that Confirm is inside the Drawer and
viewport and is the element hit at its center (not masked), Tabs to Confirm, and commits
`["o100"]`.

| Step | Result (headless Chromium) |
|---|---|
| RED before fix | CJK portrait: text 454–551 in a 487–519 button. CJK landscape: text 188–245 in a 201–233 button. Latin portrait/landscape: button right edge 811 past the list edge (359 / 651). One isolated Latin landscape run first failed on Drawer lookup (`expected null not to be null`); two reruns gave the layout RED above |
| GREEN | capacity file 7/7 |
| Mutation: drop `auto-rows-max` only | all 4 new stories fail (text spills out of a 32 px button); restored |
| Mutation: restore `break-words` only | CJK 2 pass, Latin 2 fail (column too wide); restored |

Results (this worktree, no install):

- `bun test ./packages/svelte/ui/tests`: 23 pass, 0 fail.
- `cd packages/svelte/ui && bun run check`: 0 errors, 0 warnings. A fresh `bun run build` succeeds (dist contains the fix).
- `cd apps/storybook && bun run test` equivalent (`npx vitest --run`): 73 tests (the earlier 69 + 4 new) in 10 files. Five consecutive runs: four had 73/73. One had 72/73, with a single intermittent failure in the unchanged `Mobile sort drawer returns focus to the sort button` (7 ms). It did not recur, and its message was not captured.
- `svelte-check` on `apps/storybook`: the same 2 pre-existing errors in untouched `UiLibrary.stories.svelte`.
- Not run: WebKit/Safari/iOS (coordinator verifies with real in-app WebKit through CUA), consumer suites, root CI.
- Out of scope, not changed: the property picker and active-filter chips still use `break-words`, so a long unbroken Latin field name could widen them the same way. The CJK and spaced-label cases pass. Not assigned: the initial mobile chip does not autofocus its input until Tab. (Superseded by follow-up 2 below, which covers the picker, the selected-field header and chips.)

## Follow-up bugfix 2 (2026-10-20): 100-character field names in picker, operator step and chips

Report (coordinator, real in-app WebKit at 667×375, measured before any upstream follow-up import):
after choosing a field with a 100-character CJK name, the operator picker's selected-field
(back) Button kept the Button base `whitespace-nowrap` (its class was only
`justify-start text-muted-foreground`). It widened the implicit grid column, so every operator
button was 1398.59 px wide; page `scrollWidth` was 1816. Ownership was extended to the field
picker, the selected-field header and the filter chips, for 100-character CJK and unbroken Latin
labels. All authored edits and mutation reverts/restores used absolute-path `apply_patch`.

Root cause (local CSS, reproduced in headless Chromium):

1. The filter editor is a `grid` with one implicit `auto` column. An `auto` track's minimum is
   the largest item min-content contribution. The nowrap back button's min-content is its whole
   one-line label, so the column, and with it every stretched operator button, grows past the
   Drawer or Popover.
2. `break-words` on picker buttons, and the header `<p>`s with no wrap rule, keep a long
   unbroken Latin word's full width as min-content. That widens the same column at the picker
   step and at later steps.
3. Chips: the Button base `shrink-0` keeps the chip at its one-line max-content width inside
   `inline-flex max-w-full`, so even CJK chips did not wrap (right edge x=1513 at every
   viewport). `break-words` also kept unbroken Latin chips wide.

Fix (`data-view-toolbar.svelte` only; no truncation, caps or UX change):

- The filter editor root gets `[overflow-wrap:anywhere]`. It is inherited, so the picker
  buttons, the step header `<p>`s, the back button and options all lower their min-content
  width. The explicit `break-words` on picker and option buttons is removed, because it would
  override the inherited value. The option button's own `[overflow-wrap:anywhere]` from
  follow-up 1 moved to the root. The options grid's `auto-rows-max` is unchanged.
- The selected-field back button: `h-auto min-h-9 whitespace-normal text-left` (min height
  equals the default Button height).
- The chip edit button: `shrink` plus `[overflow-wrap:anywhere]` instead of `break-words`.

New stories in `DataViewToolbarCapacity.stories.svelte`. Each story has the built-in `Name` and
one 100-character `text` field (operators `contains` and unary `isEmpty`). It checks the field
picker, the operator step (back button and operators), the value step, the chip, and chip
re-edit. At each step every editor child keeps its text inside its own box, does not overlap
the one above, and stays within the editor width. The editor stays inside the overlay with no
horizontal scroll and no page overflow. The input, Cancel and Confirm stay on screen. The chip
text stays inside the chip, the chip stays inside Active filters, and the remove button stays on
screen. Cancel from a chip edit returns focus to the chip.

| Story id (`ui-library-data-view-toolbar-property-capacity--…`) | Field name | Viewport | RED before fix |
|---|---|---|---|
| `phone-landscape-drawer-fits-a-100-character-cjk-field-name` | CJK | 667×375 | operator step: back button to x=1448 in a 651 px editor |
| `phone-portrait-drawer-fits-a-100-character-cjk-field-name` | CJK | 375×812 | operator step: back button to x=1448 (editor 359) |
| `desktop-popover-fits-a-100-character-cjk-field-name` | CJK | 1024×768 | operator step: back button to x=2120 (editor 1014) |
| `phone-landscape-drawer-fits-a-100-character-unbroken-latin-field-name` | unbroken Latin | 667×375 | picker step: column to x=813 |
| `phone-portrait-drawer-fits-a-100-character-unbroken-latin-field-name` | unbroken Latin | 375×812 | picker step: column to x=813 |
| `desktop-popover-fits-a-100-character-unbroken-latin-field-name` | unbroken Latin | 1024×768 | picker step: column to x=1530 |

After the editor fix, a second RED appeared at the chip (CJK right edge x=1513 at all three
viewports; Latin x=878 at both phone sizes) before the chip change. Test corrections during
RED, not product behavior: the first draft listed both long fields in one toolbar, so the Latin
field masked the CJK result (each story now has its own field), and the text-range check skips
empty elements (the `<input>`).

GREEN: capacity file 13/13 (3 earlier + 4 options + 6 field names).

Mutation checks (one change at a time, each restored with `apply_patch`, package rebuilt):

| Mutation | Failing stories |
|---|---|
| Drop editor-root `[overflow-wrap:anywhere]` | 5: both Latin option stories + 3 Latin field-name stories |
| Back button back to `justify-start text-muted-foreground` | all 6 field-name stories |
| Chip without `shrink` | 5 field-name stories (desktop Latin passes: 878 px fits at 1024) |
| Chip `break-words` instead of `anywhere` | 2 phone Latin field-name stories |
| Options grid without `auto-rows-max` | all 4 option stories |

### Intermittent sort story failure: root cause evidence

`Mobile sort drawer returns focus to the sort button` (unchanged) failed once in 10 full-suite
runs on the fixed code (run 6, 78/79), after 6 ms, at its first step:

```
Unable to perform pointer interaction as the element has `pointer-events: none`:
BUTTON(label=Sort)
```

The story before it in file order, `Open chip draft survives desktop and mobile breakpoint
changes`, ends by cancelling a mobile Drawer. It waited for unmount and chip focus, but not for
the overlay's `body { pointer-events: none }` lock to clear, so the next story's first click
could hit the lock. This is the same hygiene issue described in the review corrections. The
operator file alone passed 30/30 runs, so the race only showed under full-suite timing. Test-only
fix: that story now ends with the same unlock `waitFor` it already uses mid-story. Its assertions
are unchanged. No deterministic RED exists for this race; evidence after the fix is below.

Results (this worktree, no install, package rebuilt from the final source):

- `bun test ./packages/svelte/ui/tests`: 23 pass, 0 fail.
- `cd packages/svelte/ui && bun run check`: 0 errors, 0 warnings. `bun run build` succeeds.
- `svelte-check` on `apps/storybook`: the same 2 pre-existing errors in untouched `UiLibrary.stories.svelte`; none in the toolbar stories.
- Full Storybook (`npx vitest --run`, 79 tests in 10 files = 69 earlier + 10 new): before the hygiene fix 9/10 runs green (run 6 as above). After it: 15/15 consecutive runs 79/79. That lowers the observed rate but does not prove the race is gone.
- Not run: WebKit/Safari/iOS (coordinator verifies through CUA), consumer suites, root CI, timed backend matrix.
- Review closure: independent reviewer approved the source/capacity stories with unchanged source hashes;
  coordinator checked the completed report and the additional5-line test cleanup (it waits for body unlock,
  not bypassing a pointer failure).15 post-cleanup full runs passed, but this is not proof of zero flakiness.
  The inherited `overflow-wrap:anywhere` also reaches consumer-supplied custom `filterEditors`, so their
  text can break mid-word when constrained. Desktop100-long-option coverage is still pending: the new
  option stories cover both phone sizes; the desktop stories cover long field names, not100 options.
  No follow-up PR/merge/import or App deployment is claimed by this checkpoint.
- Remaining, not changed: the sort editor's property and direction buttons are still nowrap
  `justify-start` buttons, so a long sortable field name could widen the sort Popover or Drawer
  the same way. They are not covered by the stories. Not assigned: the initial mobile chip does
  not autofocus its input until Tab.
