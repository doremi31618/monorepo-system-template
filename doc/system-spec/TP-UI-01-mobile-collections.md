# TP-UI-01 R6 shared collection components

Task: ../project-tasks/TP-UI-01-mobile-collections.md. Approved design: Talent Pool R6; source /Users/ericzhan/Documents/SIRAYA-project/talent-pool-worktrees/TP-UI-01-R6-mobile/packages/ui and docs/system-spec/wireframes/preview/mobile-layout-proposal.html. TP Dev first has been satisfied (dec05242/PR63/deployment01f1ea4095471a9cb61bda1d1be7ebcd).

## Seven-part technical design
| Item | Change | Plan |
| --- | --- | --- |
| Backend API | Not involved | No endpoints copied or changed; callbacks belong to consumers. |
| Table/schema | Not involved | Generic row/column props only, no database knowledge or migration. |
| Backend mechanism | Not involved | No business selection/deletion/download services move into UI package. |
| Resources | Unchanged | Existing source package/build/CI only; no new app, job, storage, grants or npm publish. |
| Frontend UX | Promote approved design | Persistent search and right-hand44pxfilter/sort/More in one phone row; spacious mobile cards with identity/status, label/value fields and footer metadata/actions. Desktop semantic table stays unchanged. |
| UI components | Additive | Promote generic NotionTable/column-prefs/display-menu modules from TP to packages/svelte/ui/src/lib/ui, following upstream aliases/exports and catalog. Add optional mobile roles/footer snippet. Modify ONLY necessary DataViewToolbar responsive layout; do not wholesale replace upstream or backport TP-only query/label adaptations. |
| Frontend mechanism | Existing controlled model | Rows/query/column prefs/actions owned by consumer, no storage/cache/permissions logic introduced. Maintain existing upstream operator/query API semantics and toggle/persistent modes. Examples use synthetic generic rows, no TP-specific business fields or APIs. |

## Acceptance
- Generic imports work via @platform/svelte-ui/notion-table; proper public types/README.
- One column definition drives desktop table and mobile cards; optional mobile title/status/footer; selection and row actions are consumer-provided snippets and remain capability-gated by callers.
- Controlled prefs reconcile unknown/new/locked columns; metadata/footer does not bypass hidden columns. No duplicate IDs or unsafe HTML.
- Mobile16pxcard padding/gaps,14pxfield row gap, readable wrapping; toolbar same row at320withfilter/sort/More (all44px targets). Preserve existing toggle mode and desktop contracts.
- TDD for added observable behavior/contract using existing test seams; no speculative framework. Targeted package check/build and relevant existing tests; record actual baseline failures if any. No business APIs copied from TP.
- Update existing doc/system-spec/architecture/ui-module-catalog.md and package usage/provenance. Independent review and PR->dev before downstream import.

## Implementation status (2026-11-27)
Implemented and locally verified on the task branch (uncommitted); see the Task's records. Typography uses only built-in Tailwind sizes, so consumers need no TP theme tokens. Peer is `svelte ^5.20.0`. `searchMode="persistent"` stays visible on phones by design (R6). Phone layout coverage is Chromium Storybook at 320/390px only. Review closure, PR/CI, the dependency-audit decision and the downstream pin are pending.

## R7 status (2026-11-27)
R7 toolbar layout (right-aligned single-row control group, 300px bounded desktop search, 44px phone search; chips on their own row) is implemented from TP `4c49510` (TP Dev `b68e94b`) and verified locally in Chromium Storybook at 1280/1440 and 320/390/430. NotionTable stays at the R6 card layout; calendar and the `leading` snippet are not promoted. Independent review, PR/CI, merge and the downstream pin are pending.

## R7 review fix (2026-11-27)
Supersedes "NotionTable stays at the R6 card layout" above. On phones, exactly one leading utility plus a `mobile: 'title'` column places the utility beside the card title (logical start, 44px target inside the card); otherwise the R6 stacked top row remains. The toolbar's shared layout applies to every search mode (toggle open/close behavior and defaults unchanged). Caller `actions` provide their own 44×44 phone targets; one More trigger on phones is recommended, with batch entry inside More. Root CUA after this fix, independent review, PR/CI, merge and the downstream pin are pending.
