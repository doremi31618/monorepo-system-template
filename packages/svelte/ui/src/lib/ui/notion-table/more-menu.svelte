<script lang="ts">
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import ColumnsIcon from '@lucide/svelte/icons/columns-3';
  import { mergeProps } from 'bits-ui';
  import { Button } from '$lib/ui/button/index.js';
  import * as DropdownMenu from '$lib/ui/dropdown-menu/index.js';
  import * as Tooltip from '$lib/ui/tooltip/index.js';
  import ColumnDisplay from './column-display.svelte';
  import type { ColumnPrefs, NotionColumn } from './columns.js';
  import type { NotionCommand } from './commands.js';
  import { defaultNotionTableLabels, type NotionTableLabels } from './labels.js';

  // Grouped More menu: Display (column settings), Data (existing commands),
  // Structure (caller-gated management commands). Empty groups never render.
  let {
    columns,
    prefs = $bindable(),
    dataCommands = [],
    structureCommands = [],
    labels = defaultNotionTableLabels,
  }: {
    columns?: NotionColumn[];
    prefs?: ColumnPrefs;
    dataCommands?: NotionCommand[];
    structureCommands?: NotionCommand[];
    labels?: NotionTableLabels;
  } = $props();

  let menuOpen = $state(false);
  let displayOpen = $state(false);
  let trigger: HTMLElement | null = $state(null);
  const canDisplay = $derived(Boolean(columns?.some((column) => !column.utility)));

  // The menu entry that opened the panel is gone by the time it closes, so focus goes back to the More button —
  // but only on a real close: a Sheet↔Drawer swap keeps the panel open and focus inside it.
  function restoreFocus(event: Event) {
    event.preventDefault();
    if (displayOpen || !trigger?.isConnected) return;
    trigger.focus();
  }
</script>

{#if canDisplay || dataCommands.length || structureCommands.length}
  <DropdownMenu.Root bind:open={menuOpen}>
    <DropdownMenu.Trigger>
      {#snippet child({ props: menuProps })}
        <!-- Icon-only trigger: the tooltip names it for pointer and keyboard users. -->
        <Tooltip.Provider disableHoverableContent>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props: tooltipProps })}
                <Button {...mergeProps(menuProps, tooltipProps)} bind:ref={trigger} variant="ghost" size="icon"
                  class="size-11 md:size-9" aria-label={labels.more}><EllipsisIcon aria-hidden="true" /></Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content role="tooltip">{labels.more}</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-48">
      {#if canDisplay}
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading>{labels.display}</DropdownMenu.GroupHeading>
          <DropdownMenu.Item class="max-md:min-h-11" onSelect={() => (displayOpen = true)}
            ><ColumnsIcon />{labels.title}</DropdownMenu.Item
          >
        </DropdownMenu.Group>
      {/if}
      {#if dataCommands.length}
        {#if canDisplay}<DropdownMenu.Separator />{/if}
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading>{labels.data}</DropdownMenu.GroupHeading>
          {#each dataCommands as command (command.key)}
            <DropdownMenu.Item class="max-md:min-h-11" disabled={command.disabled} onSelect={command.onselect}>
              {#if command.icon}<command.icon />{/if}{command.label}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      {/if}
      {#if structureCommands.length}
        {#if canDisplay || dataCommands.length}<DropdownMenu.Separator />{/if}
        <DropdownMenu.Group>
          <DropdownMenu.GroupHeading>{labels.structure}</DropdownMenu.GroupHeading>
          {#each structureCommands as command (command.key)}
            <DropdownMenu.Item class="max-md:min-h-11" disabled={command.disabled} onSelect={command.onselect}>
              {#if command.icon}<command.icon />{/if}{command.label}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  {#if columns && canDisplay}
    <ColumnDisplay bind:open={displayOpen} {columns} bind:prefs {labels} onCloseAutoFocus={restoreFocus} />
  {/if}
{/if}
