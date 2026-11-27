# UI module catalog and usage audit

Initial bounded inventory for M4-04 (2026-10-20). This page covers the structured directory
toolbar changed by this Work Item; it does not claim a complete audit of every UI module.
[Module specification](./data-view-toolbar.md) · [M4-04 Task](../../project-tasks/M4-04-filter-operators.md).

## Catalog

| ID | User task / public module | Owner and rules | Responsive/accessibility | Required verification |
| --- | --- | --- | --- | --- |
| FILTER-001 | Directory search/filter/sort: `@platform/svelte-ui/data-view-toolbar` (`DataViewToolbar`) | Shared package. Controlled properties/query; consumers own business metadata, API validation and persistence. Optional operator operand metadata, repeated stable-ID rules and text normalizer; existing callers retain old defaults. No route/API/Entity rules, automatic storage or consumer-specific Unicode policy in Vendor. Never fork a filter form merely for a different directory. | Desktop Popover, phone Drawer; Apply commits a draft; Cancel/Escape discards; independent chip edit/remove and focus return. Open drafts survive breakpoint changes. Property/options/chips wrap; bounded internal scroll keeps all54 long-named properties reachable without page overflow. | Package public-helper tests, operator interactions, default caller regressions, async loaders, repeated identity, normalizer/codec round-trip, keyboard/focus and1024×768/375×667/667×375 capacity stories. Real iOS/on-screen keyboard remain unverified, not certified. |
| NOTION-TABLE-001 | Responsive collection: `@platform/svelte-ui/notion-table` (`NotionTable`, `NotionMoreMenu`, `ColumnDisplay`, column-pref helpers) and `@platform/svelte-ui/checkbox` | Shared package. One `NotionColumn[]` drives the desktop semantic table and phone cards (optional `mobile` title/status/footer roles, `footer` snippet). Rows, prefs, selection, row actions and More-menu commands are controlled/provided by the consumer; no storage, permission, API or business batch logic. Promoted from Talent Pool `64f5a17` (docs `b7af0ac`, TP Dev `dec05242`/PR63). | Desktop table unchanged; below `md` cards with 16px padding, 14px field gap, wrapping values; 44px phone controls; display settings in Sheet (desktop) / Drawer (phone) with focus return and Alt+Arrow reorder. | Package contract tests (column prefs reconcile/lock/utility/stale, public export surface), svelte-check, `svelte-package` build, Storybook `NotionTable` desktop + 320/390 phone stories (Chromium). Typography uses built-in `text-sm`/`text-xs` only. Peer `svelte ^5.20.0` (`$props.id()`). Real-device/iOS keyboard not verified. |

The public package entrypoint is authoritative. Build `dist` with `svelte-package`, never
hand-edit it. External pinned consumers must record source commit/subtree and generated
artifact provenance; this catalog does not imply that an external App already imported it.

## Usage audit

| Surface | Catalog ID / implementation | Adoption and verification | Work Item / checked version |
| --- | --- | --- | --- |
| Storybook `DataViewToolbar.stories.svelte` | FILTER-001; public package import | Existing/default interactions retained; part of the full69-test Storybook run. R7 story: at 1280/1440 the whole control group is one row, flush right, search <=300px; at 320/390/430 one row, 44px search/Filter/Sort and caller action, no page overflow. | M4-04 task branch;2026-10-20 |
| Storybook `DataViewToolbarOperators.stories.svelte` | FILTER-001; public package import | New unary/multi/repeat/normalizer/draft/focus/resize interaction coverage. Independent re-review reran focused stories twice. TP-UI-01 R6 replaced the old "Persistent search collapses on mobile" story with "Persistent search stays visible with 44px controls on one phone row" (320px). | M4-04 task branch;2026-10-20 |
| Storybook `DataViewToolbarCapacity.stories.svelte` | FILTER-001; public package import |54 properties with100-character names; actual keyboard scroll to last field, viewport/overflow and focus assertions at three Chromium viewports. Desktop clipping reproduced before the fix. | M4-04 task branch;2026-10-20 |
| Storybook `NotionTable.stories.svelte` | NOTION-TABLE-001 + FILTER-001; public package imports, synthetic rows only | Persistent toolbar + `NotionMoreMenu` actions + table; desktop 14px text. Phone stories at 320×568, 390×844 and 430×932: single selection beside the title (44×44, overlaps the title row, ends before the title text, inside the card border, toggles), fallback stacked top row for two leading utilities and for no title column, title/status/fields/footer/actions visible order, 16px card padding, 14px field gap, 12px captions vs 14px values, 17px title, no page horizontal overflow, 44×44 caller-owned selection label that toggles the row; hidden `footer` column stays hidden. | TP-UI-01 R6 promotion branch; 2026-11-27 |
| Web admin assets/users/CMS/roles routes | FILTER-001; existing public `DataViewToolbar` imports | Existing interface, no opt-in business changes. Whole Web/repository regression remains a required CI gate; no new real-browser acceptance claimed for these routes. | M4-04 inventory against base `b611268` |

The extra manual Storybook typecheck has two errors in untouched `UiLibrary` Accordion/Select
examples; package check is clean. Do not label that extra check green. Full CI and the App's
Dev acceptance are separate from package/component evidence.

M4-04 follow-up `4859a0e` / Dev PR#25: capacity stories now also verify100 options with100-character
CJK and unbroken Latin labels at1024x768,375x812 and667x375 (15 capacity stories;81 total Chromium
stories). These check text containment, non-overlap, keyboard access to option100 and a reachable
Confirm action. The two new desktop stories were first-run-green characterization, not RED-first.
An upstream IAB/WebKit667x375 CJK option check also passed; no physical-device, external App import or
Dev acceptance is implied. Root check/test/build passed locally; GitHub CI failed at the unchanged
dependency audit, with its exception extension pending. See the Task for evidence and prior flakes.

TP-UI-01 R7 review fix (2026-11-27): NotionTable now ports TP `4c49510` selection-beside-title on phones, gated: exactly one leading utility plus a `mobile: 'title'` column puts that utility absolutely at the card's logical start beside the title (title/status get start padding); several leading utilities or no title column keep the R6 stacked top row. No new props; selection and batch commands stay caller-owned (R7 phone batch entry is a caller More command). The toolbar layout applies to all search modes (toggle open/close behavior and defaults unchanged); phone control gap is 8px; `actions` content and its 44×44 phone target belong to the caller, with one More trigger recommended on phones. Root's first CUA evidence (`TP/TP-UI-01-R7-review/monorepo/toolbar-320.png`) showed the story's 84×24 caller button; the story button and test were fixed, and post-fix CUA is pending.

TP-UI-01 R7 (2026-11-27): the `DataViewToolbar` control row (search, Filter, Sort, caller `actions`) is one never-wrapping group right-aligned at every width; desktop search is bounded to ~300px (min 144px) with free space on the left; phone search input is 44px and fills the remaining row; applied chips stay on their own row. Source TP `4c49510` (docs `8daed68`, TP Dev `b68e94b`). Only layout classes changed; the TP `leading` snippet, calendar, NotionTable selection-beside-title and TP theme CSS were evaluated and not promoted. *Superseded by the R7 review fix below for NotionTable.* The earlier "search spans >50% of the toolbar" assertion in `Persistent localized search` was replaced by the bounded R7 one. Upstream is not merged and there is no downstream pin yet.

TP-UI-01 R6 promotion (2026-11-27): `DataViewToolbar` gains only the responsive layout (persistent search
stays visible on phones; filter/sort/search triggers and the controls row are at least 44px below `md`;
`min-w` not fixed width, so labelled buttons at 640-767px do not clip). Query/operator semantics,
labels and `toggle` defaults are unchanged. This changes `persistent` on phones (previously a toggle); the
story that asserted the old collapse was replaced. See the Task for TDD limits and test evidence.
