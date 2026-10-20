# UI module catalog and usage audit

Initial bounded inventory for M4-04 (2026-10-20). This page covers the structured directory
toolbar changed by this Work Item; it does not claim a complete audit of every UI module.
[Module specification](./data-view-toolbar.md) · [M4-04 Task](../../project-tasks/M4-04-filter-operators.md).

## Catalog

| ID | User task / public module | Owner and rules | Responsive/accessibility | Required verification |
| --- | --- | --- | --- | --- |
| FILTER-001 | Directory search/filter/sort: `@platform/svelte-ui/data-view-toolbar` (`DataViewToolbar`) | Shared package. Controlled properties/query; consumers own business metadata, API validation and persistence. Optional operator operand metadata, repeated stable-ID rules and text normalizer; existing callers retain old defaults. No route/API/Entity rules, automatic storage or consumer-specific Unicode policy in Vendor. Never fork a filter form merely for a different directory. | Desktop Popover, phone Drawer; Apply commits a draft; Cancel/Escape discards; independent chip edit/remove and focus return. Open drafts survive breakpoint changes. Property/options/chips wrap; bounded internal scroll keeps all54 long-named properties reachable without page overflow. | Package public-helper tests, operator interactions, default caller regressions, async loaders, repeated identity, normalizer/codec round-trip, keyboard/focus and1024×768/375×667/667×375 capacity stories. Real iOS/on-screen keyboard remain unverified, not certified. |

The public package entrypoint is authoritative. Build `dist` with `svelte-package`, never
hand-edit it. External pinned consumers must record source commit/subtree and generated
artifact provenance; this catalog does not imply that an external App already imported it.

## Usage audit

| Surface | Catalog ID / implementation | Adoption and verification | Work Item / checked version |
| --- | --- | --- | --- |
| Storybook `DataViewToolbar.stories.svelte` | FILTER-001; public package import | Existing/default interactions retained; part of the full69-test Storybook run. | M4-04 task branch;2026-10-20 |
| Storybook `DataViewToolbarOperators.stories.svelte` | FILTER-001; public package import | New unary/multi/repeat/normalizer/draft/focus/resize interaction coverage. Independent re-review reran focused stories twice. | M4-04 task branch;2026-10-20 |
| Storybook `DataViewToolbarCapacity.stories.svelte` | FILTER-001; public package import |54 properties with100-character names; actual keyboard scroll to last field, viewport/overflow and focus assertions at three Chromium viewports. Desktop clipping reproduced before the fix. | M4-04 task branch;2026-10-20 |
| Web admin assets/users/CMS/roles routes | FILTER-001; existing public `DataViewToolbar` imports | Existing interface, no opt-in business changes. Whole Web/repository regression remains a required CI gate; no new real-browser acceptance claimed for these routes. | M4-04 inventory against base `b611268` |

The extra manual Storybook typecheck has two errors in untouched `UiLibrary` Accordion/Select
examples; package check is clean. Do not label that extra check green. Full CI and the App's
Dev acceptance are separate from package/component evidence.
