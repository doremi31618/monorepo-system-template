# Notion-like Data View Filter Builder Project Task

> **Work Item ID**: SUI-001
> **Status**: In Review
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/SUI-001-notion-filter-builder`
> **Base**: `origin/dev` (`55e4ad6`)
> **Worktree**: `/Users/ericzhan/Documents/SIRAYA-project/monorepo-system-template-worktrees/SUI-001-notion-filter-builder`
> **PR**: https://github.com/doremi31618/monorepo-system-template/pull/21
> **Related Spec**: `doc/system-spec/architecture/data-view-toolbar.md`
> **Release**: pending
> **Last updated**: 2026-09-07

## Objective

Turn `@platform/svelte-ui/data-view-toolbar` into a reusable Notion-like search, filter, and sort
system with explicit per-rule confirmation, datatype-specific value editors, a consumer-owned async
option source, and a bottom Drawer on narrow screens.

## Discovery / Shared Understanding

- **Mode**: Grill Me enabled
- **Gate status**: Approved
- **Approved at**: 2026-09-07
- **Summary**: Search remains a distinct debounced control. Structured filters follow Add Filter →
  Property → Operator/Value → Confirm. Only a confirmed rule changes the controlled query. Applied
  rules remain visible and independently editable or removable. Sort stays separate.
- **Key decisions**: Different properties AND together; a property owns at most one rule; multi-value
  choices OR within that rule. Desktop uses Popover and mobile uses a bottom Drawer. Built-in property
  types are text, enum, relation, number, date, and boolean. Enum/relation support static options or an
  injected paginated async option provider. Consumers own API calls and query adaptation.
- **Assumptions**: Existing URL codec and current consumers remain compatible with the evolved query
  shape. Product styling continues to use semantic tokens and Lucide.
- **Risks and acceptance**: Explicit confirmation differs from the previous immediate-commit behavior.
  Component interaction tests must prove drafts never leak into committed queries and existing query
  codec tests must remain green.

## Acceptance Criteria

- [x] Search emits after 300 ms, immediately on Enter, and clears/restores focus with Escape.
- [x] Add Filter advances through property and datatype-specific rule configuration.
- [x] Closing an incomplete editor discards its draft; Confirm alone commits one complete rule.
- [x] Applied rule chips can be edited, removed independently, or cleared together.
- [x] One rule per property is enforced; different properties compose with AND semantics.
- [x] Text, enum, relation, number, date, and boolean render appropriate editors.
- [x] Enum/relation accept static options or an abortable paginated async option provider.
- [x] Desktop uses Popover and mobile uses an accessible bottom Drawer.
- [x] Sort remains a separate ordered control and does not contribute to filter count.
- [ ] Storybook, package tests/check/build, Web checks, and repository regression checks pass.

## Scope

### In scope

- Drawer primitive installed through the project shadcn-svelte workflow.
- Public filter/search/query contracts and datatype editor composition.
- Data View Toolbar implementation, query tests, Storybook states, and interaction tests.
- Specification and package usage documentation.

### Out of scope

- App-specific API clients, routes, fields, or backend predicates.
- Nested OR groups, Saved Views, URL policy changes, or external npm publication.
- Copying Notion brand colors, typography, or assets.

## Required Tests

- [x] Unit: query validation and datatype/option-provider contracts.
- [x] Component: draft/confirm/edit/remove/clear, Popover, bottom Drawer, async pagination.
- [x] Regression: existing search, sort, URL codec, package consumers, Storybook.
- [x] Lint, check, build, and dependency boundary validation.

## Tasks

- [x] Grill Me discovery and shared-understanding approval
- [x] Isolated branch/worktree and Project Task
- [x] Specification update
- [x] RED/GREEN Drawer and controlled filter builder slices
- [x] RED/GREEN datatype and async option-provider slices
- [x] Storybook and package documentation
- [x] Full validation and review handoff

## Decisions and Work Log

- 2026-09-07: `origin/dev` and `origin/main` contain the same `packages/svelte/ui` tree, so the
  repository-standard `origin/dev` base preserves the user-nominated main-package baseline.
- 2026-09-07: The owner approved a reusable contract with consumer-owned data fetching and a later
  versioned source snapshot into the Databricks repository.
- 2026-09-07: Seven browser interaction stories, six query/drawer unit tests, package checks/build,
  dependency boundaries, and Storybook production build passed. `vaul-svelte` is a runtime package
  dependency because the published Drawer source imports it.
- 2026-09-07: Full repository `bun run check` passed with only 15 pre-existing Web warnings; full
  `bun run test` passed (API 56, runtime 4, service UI 2, browser SDK 1, Storybook 41, Web regression).

## Handoff

- **Commit/PR**: `d096bb8`; https://github.com/doremi31618/monorepo-system-template/pull/21
- **Branch/Worktree**: recorded above
- **Validation**: package unit 6/6; component 6/6; full repository check and test passed; Svelte UI
  check 0 errors/warnings; package and Storybook builds passed; dependency checks passed
- **Known issues**: None
- **Next action**: push branch and open the monorepo PR against `dev`, then import the reviewed source
  snapshot into DBX-CS-APP-073
