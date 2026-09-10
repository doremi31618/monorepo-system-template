# SUI-002 — Shared paged selection and automatic loading

- Status: Review
- Owner: Codex 5.6 Terra; coordinator/reviewer: Codex
- Branch: `feat/SUI-002-paged-selection`; base: `origin/dev` (`16b084b`)
- Source commit: `530cf66a6c3a90a4b0ffbcc6b92de962b58b10fa`; [PR #23](https://github.com/doremi31618/monorepo-system-template/pull/23); unreleased
- Spec: [Paged selection](../system-spec/architecture/paged-selection.md)
- Consumer: Databricks Pipeline DBX-CS-APP-076

## Discovery

Grill Me enabled initially. User explicitly requested implementation in the UI library first, then App adoption (2026-09-10), and requested Codex 5.6 Terra as primary developer. Ordinary reversible UX assumptions below are recorded under the early-implementation rule. No deployment is authorized by this task.

## Objective and acceptance

- Generic searchable multiselect: trigger and selected chips, desktop Popover/mobile Drawer, checkboxes, remote search, independent query cursor, bottom loading and explicit failure retry.
- Existing selected labels survive searches/pagination; locked values cannot be removed.
- Loading, empty, error, end states and keyboard/focus behavior are accessible.
- Shared auto-load sentinel works in page and nested scrollers, prevents duplicate loads, and ignores disabled/error state.
- Generic responsive creation overlay may be composed from existing primitives; no app API/store/domain dependency enters UI package.
- Canonical package is built/tested and committed before importing source/dist into App pinned snapshot.

## Required validation

Package build/check, meaningful Storybook browser interaction tests and responsive stories/build, downstream frontend checks. Repository checks required by onboarding are run or limitations explicitly recorded. Do not claim unchecked suites passed.

## Assumptions

Search debounce follows current UI conventions; selection remains draft until consumer saves the form. Error stops automatic retries until explicit retry. Generic labels remain customizable. No database change in UI package.

## Work log / handoff

Implemented `@platform/svelte-ui/searchable-multi-select` (`SearchableMultiSelect`, `AutoLoadSentinel`) and responsive Storybook examples. Consumer DBX-CS-APP-076 imports the canonical source/dist snapshot.

Verification on 2026-09-10:

- UI package check/build and Storybook browser tests: 47 passed, including desktop/mobile focus, remote alias matches, stale search, retained selections, offscreen loading, failed-page retry and repeated-cursor protection.
- `bun run check`, `bun run test`, `bun run build`: passed. Web check reports 0 errors and 15 existing accessibility warnings in unrelated admin/CMS files; Storybook build reports the existing chunk-size advisory.
- App consumer typecheck, snapshot integrity and real desktop/mobile selection flows verified in DBX-CS-APP-076.
- Independent reviewer inspected library behavior; corrections included request lifecycle, keyboard/focus, disabled state and explicit retry behavior. Independent reviewer approved source `530cf66` and the consumer snapshot.

Release status: review only; no main merge or production deployment performed.
