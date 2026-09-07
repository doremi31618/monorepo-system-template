# Notion-like Data View Filter Builder Project Task

> **Work Item ID**: SUI-001
> **Status**: Doing
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/SUI-001-notion-filter-builder`
> **Base**: `origin/dev` (`55e4ad6`)
> **Worktree**: `/Users/ericzhan/Documents/SIRAYA-project/monorepo-system-template-worktrees/SUI-001-notion-filter-builder`
> **PR**: pending
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

- [ ] Search emits after 300 ms, immediately on Enter, and clears/restores focus with Escape.
- [ ] Add Filter advances through property and datatype-specific rule configuration.
- [ ] Closing an incomplete editor discards its draft; Confirm alone commits one complete rule.
- [ ] Applied rule chips can be edited, removed independently, or cleared together.
- [ ] One rule per property is enforced; different properties compose with AND semantics.
- [ ] Text, enum, relation, number, date, and boolean render appropriate editors.
- [ ] Enum/relation accept static options or an abortable paginated async option provider.
- [ ] Desktop uses Popover and mobile uses an accessible bottom Drawer with a stable action footer.
- [ ] Sort remains a separate ordered control and does not contribute to filter count.
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

- [ ] Unit: query validation and datatype/option-provider contracts.
- [ ] Component: draft/confirm/edit/remove/clear, Popover, bottom Drawer, async pagination.
- [ ] Regression: existing search, sort, URL codec, package consumers, Storybook.
- [ ] Lint, check, build, and dependency boundary validation.

## Tasks

- [x] Grill Me discovery and shared-understanding approval
- [x] Isolated branch/worktree and Project Task
- [ ] Specification update
- [ ] RED/GREEN Drawer and controlled filter builder slices
- [ ] RED/GREEN datatype and async option-provider slices
- [ ] Storybook and package documentation
- [ ] Full validation and review handoff

## Decisions and Work Log

- 2026-09-07: `origin/dev` and `origin/main` contain the same `packages/svelte/ui` tree, so the
  repository-standard `origin/dev` base preserves the user-nominated main-package baseline.
- 2026-09-07: The owner approved a reusable contract with consumer-owned data fetching and a later
  versioned source snapshot into the Databricks repository.

## Handoff

- **Commit/PR**: pending
- **Branch/Worktree**: recorded above
- **Validation**: pending
- **Known issues**: None
- **Next action**: update the shared specification, then begin the first RED component test
