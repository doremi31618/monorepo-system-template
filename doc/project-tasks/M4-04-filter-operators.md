# M4-04 — Data view toolbar: opt-in operators and repeated rules

- Status: Review — independent code review approved; Dev PR and CI pending
- Actor/roles: Codex coordinator (Owner/Integrator); Claude Code CLI Sonnet implementation,
  Opus correction and separate read-only Opus Reviewer; no direct dev/main edits
- Branch/worktree: `codex/M4-04-filter-operators` at
  `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/M4-04-filter-operators`
- Dev PR/Main PR/deployment: pending; no main merge or release before integrated App Dev UAT
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

- Independent review of the diff and public interface.
- Re-review of the corrections above, including correction 3.
- Storybook mobile stories use the `mobile1` viewport or Vitest `page.viewport` resizing in headless Chromium only; no real device, Safari or iOS check was done, and the `100dvh` drawer anchoring from the consumer patch was only verified through those stories.
- Not run: web/API suites, `bun run lint`, Storybook build, a11y audit.
- Coordinator still must commit, then import the reviewed package into the consumer snapshot and update `svelte-ui.snapshot.json`.
