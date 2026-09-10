# SUI-002 — Shared paged selection and automatic loading

- Status: Doing
- Owner: Codex 5.6 Terra; coordinator/reviewer: Codex
- Branch: `feat/SUI-002-paged-selection`; base: `origin/dev` (`16b084b`)
- PR/commit/release: pending
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

Implementation in progress; test results, source commit and review to be recorded.
