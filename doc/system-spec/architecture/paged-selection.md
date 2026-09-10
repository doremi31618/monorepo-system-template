# Shared paged selection

Work Item: SUI-002. [Project task](../../project-tasks/SUI-002-paged-selection.md).

## Product contract

A field displays its label, selection trigger and selected chips. Opening it reveals a searchable checkbox list in a desktop Popover or mobile Drawer. Users can toggle multiple choices without closing the list. Locked selections remain visible but cannot be removed. Empty values display a placeholder. Closing changes presentation only; persistence belongs to the consumer form.

Remote options load when the control opens; searching resets the cursor. Scrolling to the end fetches a next page. Preserve current selections even when absent from the new search/page. Errors retain loaded items and expose a retry action. Never automatically loop retries. List viewport fits available screen height; long labels wrap/truncate without horizontal overflow. Escape/close restores trigger focus using existing accessible overlay primitives.

## Technical contract

`@platform/svelte-ui/searchable-multi-select` exports `SearchableMultiSelect`, option/loader types, and `AutoLoadSentinel`. Option values are stable strings. Consumer supplies `loadOptions({search,cursor,signal})` returning items and nextCursor, or static options; the library owns query/page/loading/error lifecycle and discards stale responses. `selectedOptions` seeds labels for values not in the current page. No domain fetch URLs, persistence or stores in the UI package.

`AutoLoadSentinel` invokes a supplied callback when visible within a page/nested scroller. It respects hasMore/loading/disabled/error, cleans up observers, guards overlapping callbacks and can fill short viewports incrementally. Failure requires explicit retry. Consumer owns request state and cursor validity across search changes.

## Validation

Real browser stories cover desktop/mobile, keyboard open/select/close, pagination in nested scroller, stale requests, duplicates, locked selection, empty and failure/retry. Build and Svelte type check validate the public exports. The App imports a source commit-pinned artifact after upstream validation.
