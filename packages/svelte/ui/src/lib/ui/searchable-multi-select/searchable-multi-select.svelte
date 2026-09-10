<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
  import { Badge } from '$lib/ui/badge/index.js';
  import { Button } from '$lib/ui/button/index.js';
  import * as Drawer from '$lib/ui/drawer/index.js';
  import { Input } from '$lib/ui/input/index.js';
  import * as Popover from '$lib/ui/popover/index.js';
  import AutoLoadSentinel from './auto-load-sentinel.svelte';

  export interface SearchableMultiSelectOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    locked?: boolean;
    badge?: string;
  }
  export interface SearchableMultiSelectLoadResult { items: SearchableMultiSelectOption[]; nextCursor: string | null; }
  export type SearchableMultiSelectLoader = (input: { search: string; cursor?: string; signal: AbortSignal }) => Promise<SearchableMultiSelectLoadResult>;

  let {
    label,
    value = $bindable<string[]>([]),
    options = [],
    selectedOptions = [],
    loadOptions,
    placeholder,
    disabled = false,
    ariaLabel,
  }: {
    label: string;
    value?: string[];
    options?: SearchableMultiSelectOption[];
    selectedOptions?: SearchableMultiSelectOption[];
    loadOptions?: SearchableMultiSelectLoader;
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
  } = $props();

  const isMobile = new IsMobile();
  let open = $state(false);
  let search = $state('');
  let items = $state<SearchableMultiSelectOption[]>([]);
  let nextCursor = $state<string | null>(null);
  let loading = $state(false);
  let error = $state('');
  let controller: AbortController | undefined;
  let request = 0;
  let searchInput = $state<HTMLInputElement | null>(null);
  const cache = new Map<string, SearchableMultiSelectOption>();
  const selected = $derived(value.map((id) => cache.get(id) ?? selectedOptions.find((item) => item.value === id) ?? { value: id, label: id }));
  const visible = $derived.by(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (loadOptions ? items : options).filter((item) => !needle || `${item.label} ${item.description ?? ''}`.toLocaleLowerCase().includes(needle));
  });
  $effect(() => { for (const item of [...options, ...selectedOptions, ...items]) cache.set(item.value, item); });
  $effect(() => {
    if (!open || !loadOptions) return;
    const timeout = setTimeout(() => void load(true), 180);
    return () => clearTimeout(timeout);
  });
  $effect(() => () => controller?.abort());

  async function load(reset: boolean) {
    if (!loadOptions || (!reset && (!nextCursor || loading))) return;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    const token = ++request;
    loading = true;
    error = '';
    try {
      const page = await loadOptions({ search: search.trim(), cursor: reset ? undefined : nextCursor ?? undefined, signal: active.signal });
      if (token !== request) return;
      items = reset ? page.items : merge(items, page.items);
      nextCursor = page.nextCursor;
    } catch (cause) {
      if (active.signal.aborted || token !== request) return;
      error = cause instanceof Error ? cause.message : `無法載入${label}`;
    } finally { if (token === request) loading = false; }
  }
  function merge(current: SearchableMultiSelectOption[], incoming: SearchableMultiSelectOption[]) {
    return [...new Map([...current, ...incoming].map((item) => [item.value, item])).values()];
  }
  function toggle(option: SearchableMultiSelectOption) {
    if (option.disabled || option.locked) return;
    value = value.includes(option.value) ? value.filter((id) => id !== option.value) : [...value, option.value];
  }
  function remove(option: SearchableMultiSelectOption) { if (!option.locked && !option.disabled) value = value.filter((id) => id !== option.value); }
  async function changeOpen(next: boolean) { open = next; if (next) { await tick(); searchInput?.focus(); } }
</script>

{#snippet trigger()}
  <Button type="button" variant="outline" class="min-h-11 h-auto w-full justify-between gap-2 px-3 py-2 text-left" disabled={disabled} aria-label={ariaLabel ?? `選擇${label}`}>
    <span class="flex min-w-0 flex-1 flex-wrap gap-1.5">{#each selected as option (option.value)}<span class="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"><span class="truncate">{option.label}</span>{#if !option.locked && !option.disabled}<button type="button" class="rounded focus-visible:outline-2" aria-label={`移除 ${option.label}`} onclick={(event) => { event.stopPropagation(); remove(option); }}><XIcon class="size-3" /></button>{/if}</span>{:else}<span class="text-muted-foreground">{placeholder ?? `選擇${label}`}</span>{/each}</span><ChevronDownIcon class="size-4 shrink-0" />
  </Button>
{/snippet}

{#snippet content()}
  <div class="flex min-h-0 flex-col gap-3 p-3" aria-label={`${label} 選項`}>
    <label class="relative"><span class="sr-only">搜尋{label}</span><SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input bind:ref={searchInput} bind:value={search} type="search" class="h-11 pl-9" placeholder={`搜尋${label}`} aria-label={`搜尋${label}`} /></label>
    <div class="max-h-[min(50dvh,20rem)] overflow-y-auto" aria-live="polite">
      {#each visible as option (option.value)}
        <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60" disabled={option.disabled || option.locked} aria-pressed={value.includes(option.value)} onclick={() => toggle(option)}>
          <span class="grid size-4 shrink-0 place-items-center rounded border" class:bg-primary={value.includes(option.value)} class:text-primary-foreground={value.includes(option.value)}>{#if value.includes(option.value)}<CheckIcon class="size-3" />{/if}</span><span class="min-w-0 flex-1"><span class="block truncate font-medium">{option.label}</span>{#if option.description}<span class="block truncate text-xs text-muted-foreground">{option.description}</span>{/if}</span>{#if option.badge}<Badge variant="secondary">{option.badge}</Badge>{/if}{#if option.locked}<Badge variant="outline">系統</Badge>{/if}
        </button>
      {:else}{#if !loading && !error}<p class="px-3 py-8 text-center text-sm text-muted-foreground">沒有符合的項目</p>{/if}{/each}
      {#if error}<div class="p-3 text-center"><p role="alert" class="text-sm text-destructive">{error}</p><Button class="mt-2" size="sm" variant="outline" onclick={() => void load(true)}>重試</Button></div>{/if}
      {#if loadOptions && !error}<AutoLoadSentinel onloadmore={() => load(false)} hasMore={Boolean(nextCursor)} {loading} ariaLabel={`載入更多${label}`} />{/if}
    </div>
  </div>
{/snippet}

{#if isMobile.current}
  <Drawer.Root bind:open onOpenChange={changeOpen}><Drawer.Trigger>{@render trigger()}</Drawer.Trigger><Drawer.Content><Drawer.Header><Drawer.Title>選擇{label}</Drawer.Title><Drawer.Description>可搜尋並選擇多個項目。</Drawer.Description></Drawer.Header>{@render content()}</Drawer.Content></Drawer.Root>
{:else}
  <Popover.Root bind:open onOpenChange={changeOpen}><Popover.Trigger>{@render trigger()}</Popover.Trigger><Popover.Content class="w-[min(28rem,calc(100vw-2rem))] p-0"><Popover.Header class="sr-only"><Popover.Title>選擇{label}</Popover.Title><Popover.Description>可搜尋並選擇多個項目。</Popover.Description></Popover.Header>{@render content()}</Popover.Content></Popover.Root>
{/if}
