# Desktop Data Discovery Controls

Use this reference when designing or reviewing search, filter, sort, saved views, table toolbars,
or query builders for desktop web applications.

## Contents

1. Interaction model
2. Toolbar anatomy
3. Search behavior
4. Filter behavior
5. Sort behavior
6. State and navigation
7. Keyboard and accessibility
8. Responsive behavior
9. Component architecture
10. Acceptance checklist

## 1. Interaction model

Treat search, filter, and sort as separate jobs that share one data-view toolbar:

- Use **Search** for free-text matching across a clearly disclosed scope.
- Use **Filter** for structured predicates over known properties.
- Use **Sort** for ordered precedence and direction.
- Use **View** only for reusable combinations of columns, grouping, filters, and sorts.

Keep the toolbar close to the data it controls. Do not place primary data-discovery controls in a
separate settings card above the results.

Use progressive disclosure:

- Keep inactive controls compact.
- Expand a control only while the user is editing it.
- Keep active constraints visible as a count, chip, or short summary.
- Preserve the table header and result context while a popover is open.

Do not copy another product's visual identity. Reuse the interaction grammar while applying the
project's tokens, icon family, typography, and component primitives.

## 2. Toolbar anatomy

Arrange the desktop toolbar in this order unless product context requires otherwise:

1. View selector or result label
2. Flexible spacer
3. Search
4. Filter
5. Sort
6. Display or column settings
7. Primary create action

Represent state clearly:

- Show inactive controls as quiet icon-label buttons.
- Show active controls with semantic emphasis and an accessible state such as `aria-pressed`.
- Show `Filter · 3` or `3 rules` when filters are active.
- Show `Sort · 2` when multiple sort rules are active.
- Keep destructive reset actions inside the relevant popover, not in the primary toolbar.

Avoid:

- A permanently expanded grid of every possible filter.
- A generic funnel icon with no active-state summary.
- Requiring users to open a modal to change one predicate.
- Mixing search text into a structured filter without explaining the scope.

## 3. Search behavior

Reveal local search inline from the toolbar or keep it visible when search is the dominant task.

Implement these behaviors:

- Autofocus the input when it expands.
- State the searchable fields in the placeholder or accessible description.
- Debounce remote text queries around 250–350 ms.
- Submit immediately on Enter.
- Clear the value on Escape; close the empty expanded control on a second Escape.
- Provide a visible clear action when a query is present.
- Announce updated result counts politely without moving focus.
- Preserve the current query when opening a result and returning to the collection.

Distinguish local collection search from global product search. Use `/` or a documented shortcut
for the local collection only when it does not conflict with text entry. Reserve `Cmd/Ctrl+K` for a
global command palette unless the product defines another convention.

Do not add autocomplete when there is no useful suggestion source. When suggestions exist, group
them by type and keep raw text submission available.

## 4. Filter behavior

Use a structured rule builder with a stable sentence grammar:

`Where` → `Property` → `Operator` → `Value`

Examples:

- `Where Status is In progress`
- `Where Due date is before Today`
- `Where Assignee contains Eric`

Apply these rules:

- Ask for the property first, then show only compatible operators.
- Show a value control appropriate to the property's type.
- Hide the value control for unary operators such as `is empty`.
- Apply a complete rule immediately.
- Keep incomplete drafts local and exclude them from the committed query.
- Allow users to add, edit, duplicate, and remove one rule without rebuilding the others.
- Support `AND` by default; expose `OR` or nested groups only when the product genuinely needs them.
- Summarize active rules outside the popover without reproducing the entire builder.
- Put `Clear filters` or `Delete filter` at the end of the popover with destructive semantics.

Use a popover for short desktop rule sets. Use a larger sheet or dedicated builder only when rules
are numerous, nested, or need advanced grouping.

## 5. Sort behavior

Represent sorting as an ordered rule list:

`Property` → `Direction`

Apply these rules:

- Make the first rule the primary sort.
- Show order explicitly through row order and, when useful, ordinal labels.
- Let users reorder, change direction, and remove individual rules.
- Use property-specific direction labels such as `Newest first`, `Oldest first`, `A–Z`, or
  `Highest first` instead of ambiguous arrow icons alone.
- Apply a complete sort rule immediately.
- Preserve a deterministic server tie-breaker even when it is not shown in the UI.

Do not imply multi-column sorting when the backend only supports one sort field.

## 6. State and navigation

Use one canonical committed query model for search, filter, sort, pagination, and view state.

- Serialize shareable state in the URL.
- Reset page or cursor state whenever search, filter, or sort changes.
- Apply server-side constraints before pagination.
- Keep client-only filtering limited to fully loaded datasets.
- Preserve unrelated query parameters when one control changes.
- Use replace-state for rapid search updates and push-state for meaningful view changes when
  browser history would help users.
- Parse and validate URL state on the server or route boundary.
- Ignore or repair unsupported properties, operators, values, and sort fields safely.

Separate:

- **Draft state**: incomplete popover edits.
- **Committed state**: complete rules represented in the URL and result query.
- **Result state**: loading, ready, empty, error, and stale data.

## 7. Keyboard and accessibility

Preserve the full workflow without a pointer:

- Use buttons for toolbar triggers.
- Expose expanded and pressed states.
- Move focus into an opened search field or rule editor.
- Support arrow-key navigation inside listboxes and command lists.
- Commit menu choices with Enter or Space according to the primitive's semantics.
- Remove a focused rule with an explicit action; do not make Backspace destructive without warning.
- Close overlays on Escape and restore focus to their trigger.
- Keep focus visible at every step.
- Give icon-only controls accessible names.
- Announce result-count changes with `aria-live="polite"`.
- Do not encode active filters or sort direction by color alone.

Use proven accessible primitives for popovers, comboboxes, listboxes, menus, dialogs, and sheets.

## 8. Responsive behavior

Preserve the same query model across breakpoints:

- Keep search visible or one tap away.
- Collapse secondary toolbar controls into an overflow menu when horizontal space is limited.
- Move multi-step filter and sort editors into a Sheet or Drawer on narrow screens.
- Keep active-rule counts visible in mobile triggers.
- Make the mobile editor's apply behavior explicit if immediate remote updates would be disruptive.
- Preserve drafts when rotating or resizing.

Do not replace structured filters with unrelated mobile-only fields.

## 9. Component architecture

Prefer one reusable data-view system over page-specific filter forms:

```text
DataViewToolbar
├── SearchControl
├── FilterControl
│   ├── ActiveRuleSummary
│   └── FilterRuleEditor
├── SortControl
│   └── SortRuleEditor
└── DisplayControl
```

Define typed configuration rather than hardcoding page-specific markup:

```ts
type DataProperty = {
	key: string;
	label: string;
	type: 'text' | 'enum' | 'number' | 'date' | 'person' | 'boolean';
	operators: string[];
	options?: Array<{ value: string; label: string }>;
};
```

For shadcn-svelte projects, compose existing primitives:

- `Button` for toolbar triggers and actions
- `Popover` for compact desktop editors
- `Command` or `Combobox` for searchable property and value selection
- `Select` for short fixed option sets
- `Badge` for compact active-state summaries
- `DropdownMenu` for secondary actions
- `Sheet` for narrow-screen editors
- `Input` or `InputGroup` for free-text search

Do not use a Card as the default container for search, filter, or sort controls. Use a Card only
when the entire data region is already a card and the toolbar belongs to its header.

## 10. Acceptance checklist

- [ ] Search, filter, and sort have distinct semantics.
- [ ] Inactive controls remain compact.
- [ ] Active search text and rule counts remain visible.
- [ ] Filter rules follow Property → Operator → Value.
- [ ] Sort precedence and direction are explicit.
- [ ] Complete changes apply without a separate desktop Apply button.
- [ ] Incomplete drafts do not affect results.
- [ ] URL state reproduces the current view.
- [ ] Query changes reset pagination.
- [ ] Server-side constraints run before pagination.
- [ ] Escape, Enter, arrow keys, and focus restoration work.
- [ ] Loading, no-results, invalid-query, and error states are designed.
- [ ] Mobile uses the same query model in an appropriate overlay.
- [ ] The implementation uses project tokens and accessible primitives.
