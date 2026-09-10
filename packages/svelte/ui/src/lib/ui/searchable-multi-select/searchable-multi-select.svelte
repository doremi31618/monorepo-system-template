<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
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
  export interface SearchableMultiSelectLoadResult {
    items: SearchableMultiSelectOption[];
    nextCursor: string | null;
  }
  export type SearchableMultiSelectLoader = (input: {
    search: string;
    cursor?: string;
    signal: AbortSignal;
  }) => Promise<SearchableMultiSelectLoadResult>;
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
  let retryCursor = $state<string | null>(null);
  const cache = new SvelteMap<string, SearchableMultiSelectOption>();
  $effect(() => {
    for (const item of [...options, ...items, ...selectedOptions])
      cache.set(item.value, item);
  });
  const selected = $derived(
    value.map(
      (id) =>
        selectedOptions.find((item) => item.value === id) ??
        cache.get(id) ?? { value: id, label: id },
    ),
  );
  const visible = $derived.by(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (loadOptions ? items : options).filter(
      (item) =>
        !needle ||
        `${item.label} ${item.description ?? ''}`
          .toLocaleLowerCase()
          .includes(needle),
    );
  });
  $effect(() => {
    const query = search;
    if (!open || !loadOptions) return;
    controller?.abort();
    ++request;
    items = [];
    nextCursor = null;
    retryCursor = null;
    error = '';
    loading = false;
    const timer = setTimeout(() => void load(true, query), 180);
    return () => clearTimeout(timer);
  });
  $effect(() => {
    if (!open) {
      controller?.abort();
      ++request;
      loading = false;
    }
  });
  $effect(() => () => controller?.abort());
  async function load(reset: boolean, query = search) {
    if (!loadOptions || (!reset && (!nextCursor || loading))) return;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    const token = ++request;
    const cursor = reset ? null : nextCursor;
    retryCursor = cursor;
    loading = true;
    error = '';
    try {
      const page = await loadOptions({
        search: query.trim(),
        cursor: cursor ?? undefined,
        signal: active.signal,
      });
      if (token !== request || !open || query !== search) return;
      items = reset ? page.items : merge(items, page.items);
      nextCursor = page.nextCursor;
      retryCursor = null;
    } catch (cause) {
      if (active.signal.aborted || token !== request || !open) return;
      error = cause instanceof Error ? cause.message : `無法載入${label}`;
    } finally {
      if (token === request) loading = false;
    }
  }
  function merge(
    current: SearchableMultiSelectOption[],
    incoming: SearchableMultiSelectOption[],
  ) {
    return [
      ...new Map(
        [...current, ...incoming].map((item) => [item.value, item]),
      ).values(),
    ];
  }
  function toggle(option: SearchableMultiSelectOption) {
    if (option.disabled || option.locked) return;
    value = value.includes(option.value)
      ? value.filter((id) => id !== option.value)
      : [...value, option.value];
  }
  function remove(option: SearchableMultiSelectOption) {
    if (!option.locked && !option.disabled)
      value = value.filter((id) => id !== option.value);
  }
  async function changeOpen(next: boolean) {
    open = next;
    if (next) {
      await tick();
      searchInput?.focus();
    }
  }
</script>

{#snippet triggerContent()}<span class="truncate text-muted-foreground"
    >{selected.length
      ? `已選 ${selected.length} 項`
      : (placeholder ?? `選擇${label}`)}</span
  ><ChevronDownIcon class="size-4 shrink-0" />{/snippet}
{#snippet trigger(props: Record<string, unknown> = {})}<button
    {...props}
    type="button"
    class="flex min-h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
    {disabled}
    aria-label={ariaLabel ?? `選擇${label}`}>{@render triggerContent()}</button
  >{/snippet}
{#snippet chips()}<div
    class="flex min-h-7 flex-wrap gap-1.5"
    aria-label={`已選${label}`}
  >
    {#each selected as option (option.value)}<span
        class="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
        ><span class="truncate">{option.label}</span
        >{#if !option.locked && !option.disabled}<button
            type="button"
            class="rounded focus-visible:outline-2"
            aria-label={`移除 ${option.label}`}
            onclick={() => remove(option)}><XIcon class="size-3" /></button
          >{/if}{#if option.locked}<span class="text-muted-foreground"
            >系統</span
          >{/if}</span
      >{/each}
  </div>{/snippet}
{#snippet content()}<div
    class="flex min-h-0 flex-col gap-3 p-3"
    aria-label={`${label} 選項`}
  >
    <label class="relative"
      ><span class="sr-only">搜尋{label}</span><SearchIcon
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      /><Input
        bind:ref={searchInput}
        bind:value={search}
        type="search"
        class="h-11 pl-9"
        placeholder={`搜尋${label}`}
        aria-label={`搜尋${label}`}
      /></label
    >
    <div class="max-h-[min(50dvh,20rem)] overflow-y-auto" aria-live="polite">
      {#each visible as option (option.value)}<label
          class="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          class:cursor-not-allowed={option.disabled || option.locked}
          class:opacity-60={option.disabled || option.locked}
          ><input
            type="checkbox"
            class="size-4 shrink-0 accent-primary"
            checked={value.includes(option.value)}
            disabled={option.disabled || option.locked}
            aria-label={option.label}
            onchange={() => toggle(option)}
          /><span class="min-w-0 flex-1"
            ><span class="block truncate font-medium">{option.label}</span
            >{#if option.description}<span
                class="block truncate text-xs text-muted-foreground"
                >{option.description}</span
              >{/if}</span
          >{#if option.badge}<Badge variant="secondary">{option.badge}</Badge
            >{/if}{#if option.locked}<Badge variant="outline">系統</Badge
            >{/if}</label
        >{:else}{#if !loading && !error}<p
            class="px-3 py-8 text-center text-sm text-muted-foreground"
          >
            沒有符合的項目
          </p>{/if}{/each}{#if error}<div class="p-3 text-center">
          <p role="alert" class="text-sm text-destructive">{error}</p>
          <Button
            class="mt-2"
            size="sm"
            variant="outline"
            onclick={() => void load(retryCursor === null, search)}>重試</Button
          >
        </div>{/if}{#if loadOptions && !error}<AutoLoadSentinel
          onloadmore={() => load(false)}
          hasMore={Boolean(nextCursor)}
          {loading}
          ariaLabel={`載入更多${label}`}
        />{/if}
    </div>
  </div>{/snippet}

<div class="grid gap-2">
  {@render chips()}{#if isMobile.current}<Drawer.Root
      bind:open
      onOpenChange={changeOpen}
      ><button
        type="button"
        class="flex min-h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => changeOpen(true)}
        {disabled}
        aria-label={ariaLabel ?? `選擇${label}`}
        >{@render triggerContent()}</button
      ><Drawer.Content
        ><Drawer.Header
          ><Drawer.Title>選擇{label}</Drawer.Title><Drawer.Description
            >可搜尋並選擇多個項目。</Drawer.Description
          ></Drawer.Header
        >{@render content()}</Drawer.Content
      ></Drawer.Root
    >{:else}<Popover.Root bind:open onOpenChange={changeOpen}
      ><Popover.Trigger
        >{#snippet child({ props })}{@render trigger(
            props,
          )}{/snippet}</Popover.Trigger
      ><Popover.Content class="w-[min(28rem,calc(100vw-2rem))] p-0"
        ><Popover.Header class="sr-only"
          ><Popover.Title>選擇{label}</Popover.Title><Popover.Description
            >可搜尋並選擇多個項目。</Popover.Description
          ></Popover.Header
        >{@render content()}</Popover.Content
      ></Popover.Root
    >{/if}
</div>
