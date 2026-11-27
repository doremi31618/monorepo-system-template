<script lang="ts" generics="Row">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils.js';
  import { visibleColumns, type NotionColumn } from './columns.js';

  // One column definition drives the desktop semantic table and the phone
  // labelled-value rows: below `md` the same cells re-flow with CSS only.
  let {
    columns,
    prefs,
    rows,
    rowKey,
    cell,
    header,
    empty,
    detail,
    hasDetail,
    footer,
    ariaLabel,
    busy = false,
    rowClass,
    class: className,
  }: {
    columns: NotionColumn[];
    prefs?: unknown;
    rows: Row[];
    rowKey: (row: Row) => string | number;
    cell: Snippet<[column: NotionColumn, row: Row, index: number]>;
    /**
     * Custom header content (e.g. a select-all checkbox); defaults to the label. For a leading utility
     * column it is also shown above the rows on phones, where the column headers are not drawn.
     */
    header?: Snippet<[column: NotionColumn]>;
    empty?: Snippet;
    /** Optional full-width row under a data row (inline status messages); shown when `hasDetail(row)`. */
    detail?: Snippet<[row: Row]>;
    hasDetail?: (row: Row) => boolean;
    /** Phone-only card footer (row actions, long IDs) below the metadata; never rendered on desktop. */
    footer?: Snippet<[row: Row]>;
    ariaLabel: string;
    busy?: boolean;
    rowClass?: (row: Row) => string | undefined;
    class?: string;
  } = $props();

  const view = $derived(visibleColumns(columns, prefs));
  const identityKey = $derived(view.find((column) => column.identity)?.key);
  const firstFooterKey = $derived(view.find((column) => column.mobile === 'footer')?.key);
  const leading = $derived(view.filter((column) => column.utility && !column.trailing));
  const hasLeadingUtility = $derived(leading.length > 0);
  // Phones put a single leading utility (row selection) beside the card title. Several leading utilities, or no
  // title column, keep the stacked top row so nothing overlaps.
  const selectBesideTitle = $derived(leading.length === 1 && view.some((column) => column.mobile === 'title'));

  // Table cells ignore max-width, so every header and value sits in a box whose width is set on desktop only
  // (`--cell-w`); long text, badges and URLs wrap inside it instead of widening the column. Phones use the
  // full width and never inherit a desktop width.
  const BOX =
    'min-w-0 [overflow-wrap:anywhere] md:w-(--cell-w) [&_[data-slot=badge]]:h-auto [&_[data-slot=badge]]:max-w-full [&_[data-slot=badge]]:whitespace-normal [&_[data-slot=badge]]:[overflow-wrap:anywhere]';
  const boxStyle = (column: NotionColumn) => (column.utility ? undefined : `--cell-w:${column.width ?? '14rem'}`);
  // Phone card order: selection (beside the title, or its own top row), title, status, label/value rows, footer
  // metadata, footer snippet, row actions.
  const mobileOrder = (column: NotionColumn) =>
    column.utility
      ? column.trailing
        ? 'max-md:order-7'
        : selectBesideTitle
          ? 'max-md:absolute max-md:start-2.5 max-md:top-3 max-md:before:hidden'
          : 'max-md:order-1'
      : column.mobile === 'title'
        ? cn('max-md:order-2', selectBesideTitle && 'max-md:min-h-11 max-md:ps-10 max-md:pt-2.5')
        : column.mobile === 'status'
          ? cn('max-md:order-3', selectBesideTitle && 'max-md:ps-10')
          : column.mobile === 'footer'
            ? cn('max-md:order-5', column.key === firstFooterKey && 'max-md:mt-1 max-md:border-t max-md:pt-4')
            : 'max-md:order-4';
  const stickyClass = (column: NotionColumn) =>
    column.utility && !column.trailing && column === view[0]
      ? 'md:sticky md:left-0 md:z-[1] md:bg-card md:group-hover/row:bg-muted'
      : column.key === identityKey
        ? cn('md:sticky md:z-[1] md:bg-card md:group-hover/row:bg-muted', hasLeadingUtility ? 'md:left-12' : 'md:left-0')
        : '';
</script>

<div data-slot="notion-table" class={cn('min-w-0', className)}>
  {#if header && hasLeadingUtility && rows.length}
    <!-- Phones do not draw column headers, so leading controls (select all) get their own visible row. -->
    <div data-slot="notion-table-mobile-header" class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 md:hidden">
      {#each leading as column (column.key)}
        <div class="flex min-h-11 items-center gap-1">
          {@render header(column)}
          <span class="text-xs text-muted-foreground" aria-hidden="true">{column.label}</span>
        </div>
      {/each}
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll region is focusable for keyboard scrolling.) -->
  <div
    class="max-w-full overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
    role="region"
    aria-label={ariaLabel}
    tabindex="0"
  >
    <table class={cn('w-full text-sm max-md:block md:w-max md:min-w-full', busy && 'opacity-60')} aria-busy={busy}>
      <thead class="bg-muted/50 text-left text-muted-foreground max-md:sr-only">
        <tr>
          {#each view as column (column.key)}
            <th
              scope="col"
              class={cn('px-3 py-3 align-top font-medium', column.utility && 'w-12 px-4', column.align === 'end' && 'text-end', stickyClass(column), 'md:bg-muted')}
            >
              <div data-cell-box class={BOX} style={boxStyle(column)}>
                {#if header && column.utility && !column.trailing}
                  <!-- The phone header row above owns this control below md; one copy per breakpoint. -->
                  <span class="max-md:hidden">{@render header(column)}</span><span class="md:hidden">{column.label}</span>
                {:else if header}{@render header(column)}{:else}{column.label}{/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y max-md:flex max-md:flex-col max-md:gap-4 max-md:divide-y-0 max-md:p-4">
        {#each rows as row, index (rowKey(row))}
          <tr class={cn('group/row hover:bg-muted/50 max-md:relative max-md:flex max-md:flex-col max-md:gap-3.5 max-md:rounded-lg max-md:border max-md:bg-card max-md:p-4', rowClass?.(row))}>
            {#each view as column (column.key)}
              <td
                data-label={column.utility || column.mobile === 'title' || column.mobile === 'status' ? undefined : column.label}
                class={cn(
                  'px-3 py-3 align-top',
                  column.utility && 'px-4',
                  column.align === 'end' && 'md:text-end',
                  'max-md:grid max-md:min-w-0 max-md:grid-cols-[5.375rem_minmax(0,1fr)] max-md:items-start max-md:gap-3 max-md:p-0 max-md:text-[14px] max-md:leading-[1.65] max-md:before:text-xs max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)] max-md:before:[overflow-wrap:anywhere]',
                  (column.mobile === 'title' || column.mobile === 'status') && 'max-md:block max-md:before:hidden',
                  column.mobile === 'title' && 'max-md:text-[17px] max-md:leading-snug max-md:font-semibold',
                  column.utility && 'max-md:flex max-md:min-h-11 max-md:items-center',
                  mobileOrder(column),
                  stickyClass(column),
                  column.class,
                )}
              >
                <div data-cell-box class={BOX} style={boxStyle(column)}>{@render cell(column, row, index)}</div>
              </td>
            {/each}
            {#if footer}
              <td class={cn('hidden max-md:order-6 max-md:block max-md:p-0', !firstFooterKey && 'max-md:mt-1 max-md:border-t max-md:pt-4')}>
                <div data-slot="notion-table-mobile-footer" class="min-w-0">{@render footer(row)}</div>
              </td>
            {/if}
          </tr>
          {#if detail && hasDetail?.(row)}
            <tr class="max-md:block">
              <td colspan={view.length} class="px-4 py-3 max-md:block max-md:p-0" aria-live="polite">{@render detail(row)}</td>
            </tr>
          {/if}
        {:else}
          {#if empty}
            <tr class="max-md:block">
              <td colspan={view.length} class="px-4 py-8 text-sm text-muted-foreground max-md:block">{@render empty()}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
