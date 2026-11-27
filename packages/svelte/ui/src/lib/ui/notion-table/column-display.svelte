<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import { tick, untrack } from 'svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
  import { Button } from '$lib/ui/button/index.js';
  import { Checkbox } from '$lib/ui/checkbox/index.js';
  import * as Drawer from '$lib/ui/drawer/index.js';
  import * as Sheet from '$lib/ui/sheet/index.js';
  import * as Tooltip from '$lib/ui/tooltip/index.js';
  import {
    configurableColumns,
    emptyColumnPrefs,
    moveColumn,
    toggleColumn,
    type ColumnPrefs,
    type NotionColumn,
  } from './columns.js';
  import { defaultNotionTableLabels, type NotionTableLabels } from './labels.js';

  // One body for both containers: Sheet on desktop, Drawer on phones. Only the named column list scrolls;
  // the title and the footer actions stay in view.
  let {
    open = $bindable(false),
    columns,
    prefs = $bindable(),
    labels = defaultNotionTableLabels,
    onCloseAutoFocus,
  }: {
    open: boolean;
    columns: NotionColumn[];
    prefs?: ColumnPrefs;
    labels?: NotionTableLabels;
    /** Called when the panel really closes (not when a breakpoint swaps Sheet and Drawer). */
    onCloseAutoFocus?: (event: Event) => void;
  } = $props();

  type Control = 'checkbox' | 'up' | 'down';
  const isMobile = new IsMobile();
  const items = $derived(configurableColumns(columns, prefs));
  const rowId = $props.id();
  let listElement: HTMLElement | undefined = $state();

  const controlIn = (row: Element | null | undefined, control: Control) =>
    row?.querySelector<HTMLElement>(control === 'checkbox' ? '[data-column-toggle]' : `[data-move="${control}"]`);
  const usable = (element: HTMLElement | null | undefined) =>
    element && !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true' ? element : null;

  // The keyed row moves in the DOM, which drops focus. Put it back on the same control; a move button that
  // has just become disabled (first or last place) hands focus to the other one, then to the checkbox.
  async function refocus(key: string, control: Control) {
    await tick();
    const row = listElement?.querySelector(`[data-column-key="${CSS.escape(key)}"]`);
    const other: Control = control === 'up' ? 'down' : 'up';
    const target =
      usable(controlIn(row, control)) ??
      (control === 'checkbox' ? null : usable(controlIn(row, other))) ??
      controlIn(row, 'checkbox');
    target?.focus();
  }
  function move(key: string, delta: -1 | 1, control: Control) {
    const next = moveColumn(columns, prefs, key, delta);
    prefs = next;
    void refocus(key, control);
  }
  // Alt+↑/↓ on any control of a row moves that column and keeps the same control focused.
  function handleKeydown(event: KeyboardEvent, key: string, canUp: boolean, canDown: boolean) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? -1 : 1;
    if ((delta < 0 && !canUp) || (delta > 0 && !canDown)) return;
    const origin = (event.target as HTMLElement).closest<HTMLElement>('[data-move],[data-column-toggle]');
    const control: Control = (origin?.dataset.move as Control | undefined) ?? 'checkbox';
    move(key, delta, control);
  }

  // A breakpoint swap unmounts one container and mounts the other while the panel stays open:
  // focus moves into the new one instead of falling behind it.
  $effect(() => {
    isMobile.current;
    if (!untrack(() => open)) return;
    void tick().then(() => listElement?.closest<HTMLElement>('[data-column-region]')?.focus());
  });
  function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
    if (open) return;
    onCloseAutoFocus?.(event);
  }
</script>

{#snippet moveButton(item: (typeof items)[number], direction: 'up' | 'down')}
  {@const label = direction === 'up' ? labels.moveUp(item.column.label) : labels.moveDown(item.column.label)}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          data-move={direction}
          variant="ghost"
          size="icon"
          class="size-11 md:size-8"
          disabled={direction === 'up' ? !item.canMoveUp : !item.canMoveDown}
          aria-label={label}
          onclick={() => move(item.column.key, direction === 'up' ? -1 : 1, direction)}
          >{#if direction === 'up'}<ArrowUpIcon aria-hidden="true" />{:else}<ArrowDownIcon aria-hidden="true" />{/if}</Button
        >
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content role="tooltip">{label}</Tooltip.Content>
  </Tooltip.Root>
{/snippet}

{#snippet body()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (A scrolling region must be keyboard focusable.) -->
  <div
    data-column-region
    role="region"
    aria-label={labels.columnList}
    tabindex="0"
    class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
  >
    <ul class="flex flex-col gap-1" bind:this={listElement}>
      {#each items as item (item.column.key)}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions (Alt+Arrow from any control of the row moves the column.) -->
        <li
          class="flex items-center gap-1 rounded-md border ps-3 pe-1"
          data-column-key={item.column.key}
          onkeydown={(event) => handleKeydown(event, item.column.key, item.canMoveUp, item.canMoveDown)}
        >
          <!-- The whole label (box and text) is the 44px phone target. -->
          <label class="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 md:min-h-9">
            <Checkbox
              id={`${rowId}-${item.column.key}`}
              data-column-toggle
              checked={item.visible}
              disabled={item.locked}
              aria-label={item.column.label}
              onCheckedChange={(on) => (prefs = toggleColumn(columns, prefs, item.column.key, !!on))}
            />
            <span class="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">
              {item.column.label}
              {#if item.locked}<span class="text-xs text-muted-foreground">· {labels.locked}</span>{/if}
            </span>
          </label>
          {@render moveButton(item, 'up')}
          {@render moveButton(item, 'down')}
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

{#snippet actions()}
  <div class="flex shrink-0 flex-wrap justify-end gap-2 border-t px-4 py-3">
    <Button variant="outline" class="max-md:min-h-11" onclick={() => (prefs = emptyColumnPrefs())}>{labels.reset}</Button>
    <Button class="max-md:min-h-11" onclick={() => (open = false)}>{labels.close}</Button>
  </div>
{/snippet}

<!-- Tooltips only name icon buttons; they never take pointer events (a moved row must stay clickable). -->
<Tooltip.Provider disableHoverableContent>
  {#if isMobile.current}
    <Drawer.Root bind:open>
      <!-- overflow-clip (not hidden): focus inside the column list must never scroll the Drawer surface itself. -->
      <Drawer.Content class="max-h-[85dvh] overflow-clip" onCloseAutoFocus={handleCloseAutoFocus}>
        <Drawer.Header class="shrink-0">
          <Drawer.Title>{labels.title}</Drawer.Title>
          <Drawer.Description>{labels.description}</Drawer.Description>
        </Drawer.Header>
        {@render body()}
        {@render actions()}
      </Drawer.Content>
    </Drawer.Root>
  {:else}
    <Sheet.Root bind:open>
      <Sheet.Content side="right" class="flex h-full w-full flex-col gap-0 overflow-clip p-0 sm:max-w-sm" onCloseAutoFocus={handleCloseAutoFocus}>
        <Sheet.Header class="shrink-0">
          <Sheet.Title>{labels.title}</Sheet.Title>
          <Sheet.Description>{labels.description}</Sheet.Description>
        </Sheet.Header>
        {@render body()}
        {@render actions()}
      </Sheet.Content>
    </Sheet.Root>
  {/if}
</Tooltip.Provider>
