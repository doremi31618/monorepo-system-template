<script lang="ts">
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import ListFilterIcon from '@lucide/svelte/icons/list-filter';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick } from 'svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
  import { Button } from '$lib/ui/button/index.js';
  import { Input } from '$lib/ui/input/index.js';
  import * as Popover from '$lib/ui/popover/index.js';
  import * as Sheet from '$lib/ui/sheet/index.js';
  import type {
    DataViewFilterOperator,
    DataViewFilterRule,
    DataViewProperty,
    DataViewQuery,
    DataViewSortRule,
  } from './query.js';

  let {
    properties,
    query,
    searchLabel = 'Search',
    searchPlaceholder = 'Search…',
    onquerychange,
  }: {
    properties: DataViewProperty[];
    query: DataViewQuery;
    searchLabel?: string;
    searchPlaceholder?: string;
    onquerychange?: (query: DataViewQuery) => void;
  } = $props();

  const isMobile = new IsMobile();
  const operatorLabels: Record<DataViewFilterOperator, string> = {
    is: 'is',
    isNot: 'is not',
    isAnyOf: 'is any of',
    before: 'before',
    after: 'after',
    between: 'between',
  };

  let searchExpanded = $state(false);
  let searchDraft = $state('');
  let searchDirty = $state(false);
  let searchInput: HTMLInputElement | null = $state(null);
  let searchTrigger: HTMLButtonElement | null = $state(null);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let filterOpen = $state(false);
  let filterProperty = $state<DataViewProperty | undefined>();
  let filterOperator = $state<DataViewFilterOperator | undefined>();
  let filterValueDraft = $state('');
  let filterEndDraft = $state('');
  let sortOpen = $state(false);
  let sortStep = $state<'property' | 'direction' | 'list'>('property');
  let sortProperty = $state<DataViewProperty | undefined>();

  const filterableProperties = $derived(
    properties.filter((property) => property.operators.length),
  );
  const sortableProperties = $derived(
    properties.filter(
      (property) =>
        property.sortable &&
        !query.sorts.some((sort) => sort.property === property.key),
    ),
  );

  $effect(() => {
    if (searchDirty) return;
    searchDraft = query.search;
    if (query.search) searchExpanded = true;
  });
  $effect(() => () => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });
  $effect(() => {
    if (filterOpen) resetFilterEditor();
  });
  $effect(() => {
    if (sortOpen) resetSortEditor();
  });

  function emit(next: DataViewQuery) {
    onquerychange?.(next);
  }
  function emitSearch(value: string) {
    searchDirty = false;
    emit({ ...query, search: value.trim() });
  }
  function scheduleSearch() {
    searchDirty = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => emitSearch(searchDraft), 300);
  }
  async function openSearch() {
    searchExpanded = true;
    await tick();
    searchInput?.focus();
  }
  async function closeSearch() {
    searchExpanded = false;
    await tick();
    searchTrigger?.focus();
  }
  function clearSearch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    searchDraft = '';
    emitSearch('');
    searchInput?.focus();
  }
  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (debounceTimer) clearTimeout(debounceTimer);
      emitSearch(searchDraft);
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (searchDraft) clearSearch();
    else void closeSearch();
  }

  function resetFilterEditor() {
    filterProperty = undefined;
    filterOperator = undefined;
    filterValueDraft = '';
    filterEndDraft = '';
  }
  function selectFilterProperty(property: DataViewProperty) {
    resetFilterEditor();
    filterProperty = property;
  }
  function selectedFilterValues(): string[] {
    if (!filterProperty || !filterOperator) return [];
    const existing = query.filters.find(
      (filter) =>
        filter.property === filterProperty?.key &&
        filter.operator === filterOperator,
    );
    if (!existing) return [];
    return Array.isArray(existing.value) ? existing.value : [existing.value];
  }
  function commitFilter(value: string | string[]) {
    if (!filterProperty || !filterOperator) return;
    const rule: DataViewFilterRule = {
      property: filterProperty.key,
      operator: filterOperator,
      value,
    };
    emit({
      ...query,
      filters: [
        ...query.filters.filter((filter) => filter.property !== rule.property),
        rule,
      ],
    });
  }
  function toggleFilterOption(value: string) {
    if (filterOperator !== 'isAnyOf') {
      commitFilter(value);
      return;
    }
    const selected = selectedFilterValues();
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    if (!next.length && filterProperty) removeFilter(filterProperty.key);
    else commitFilter(next);
  }
  function applyDraftFilter() {
    if (!filterValueDraft.trim()) return;
    commitFilter(
      filterOperator === 'between'
        ? [filterValueDraft.trim(), filterEndDraft.trim()].filter(Boolean)
        : filterValueDraft.trim(),
    );
  }
  function removeFilter(property: string) {
    emit({
      ...query,
      filters: query.filters.filter((filter) => filter.property !== property),
    });
  }
  function propertyFor(key: string) {
    return properties.find((property) => property.key === key);
  }
  function optionLabel(property: DataViewProperty | undefined, value: string) {
    return (
      property?.options?.find((option) => option.value === value)?.label ??
      value
    );
  }
  function filterSummary(filter: DataViewFilterRule) {
    const property = propertyFor(filter.property);
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    return `${property?.label ?? filter.property} ${operatorLabels[filter.operator]} ${values.map((value) => optionLabel(property, value)).join(', ')}`;
  }

  function resetSortEditor() {
    sortProperty = undefined;
    sortStep = query.sorts.length ? 'list' : 'property';
  }
  function selectSortProperty(property: DataViewProperty) {
    sortProperty = property;
    sortStep = 'direction';
  }
  function directionLabels(property: DataViewProperty | undefined) {
    if (property?.type === 'date')
      return { asc: 'Oldest first', desc: 'Newest first' };
    if (property?.type === 'number')
      return { asc: 'Lowest first', desc: 'Highest first' };
    return { asc: 'A–Z', desc: 'Z–A' };
  }
  function addSort(direction: DataViewSortRule['direction']) {
    if (!sortProperty) return;
    emit({
      ...query,
      sorts: [
        ...query.sorts.filter((sort) => sort.property !== sortProperty?.key),
        { property: sortProperty.key, direction },
      ],
    });
    sortStep = 'list';
    sortProperty = undefined;
  }
  function removeSort(property: string) {
    const sorts = query.sorts.filter((sort) => sort.property !== property);
    emit({ ...query, sorts });
    if (!sorts.length) sortStep = 'property';
  }
  function moveSort(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= query.sorts.length) return;
    const sorts = [...query.sorts];
    [sorts[index], sorts[target]] = [sorts[target], sorts[index]];
    emit({ ...query, sorts });
  }
</script>

{#snippet filterEditor()}
  <div class="grid gap-2" aria-label="Filter editor">
    {#if !filterProperty}
      <p class="px-2 pt-1 text-xs font-medium text-muted-foreground">
        Filter by
      </p>
      {#each filterableProperties as property (property.key)}
        <Button
          variant="ghost"
          class="justify-start"
          onclick={() => selectFilterProperty(property)}
          >{property.label}</Button
        >
      {/each}
    {:else if !filterOperator}
      <Button
        variant="ghost"
        class="justify-start text-muted-foreground"
        onclick={resetFilterEditor}>{filterProperty.label}</Button
      >
      {#each filterProperty.operators as operator (operator)}
        <Button
          variant="ghost"
          class="justify-start"
          onclick={() => (filterOperator = operator)}
          >{operatorLabels[operator]}</Button
        >
      {/each}
    {:else if filterProperty.options?.length}
      <p class="px-2 pt-1 text-xs text-muted-foreground">
        {filterProperty.label}
        {operatorLabels[filterOperator]}
      </p>
      {#each filterProperty.options as option (option.value)}
        <Button
          variant={selectedFilterValues().includes(option.value)
            ? 'secondary'
            : 'ghost'}
          class="justify-start"
          aria-pressed={selectedFilterValues().includes(option.value)}
          onclick={() => toggleFilterOption(option.value)}
          >{option.label}</Button
        >
      {/each}
    {:else}
      <p class="px-2 pt-1 text-xs text-muted-foreground">
        {filterProperty.label}
        {operatorLabels[filterOperator]}
      </p>
      <Input
        type={filterProperty.type === 'date'
          ? 'date'
          : filterProperty.type === 'number'
            ? 'number'
            : 'text'}
        aria-label={`${filterProperty.label} value`}
        bind:value={filterValueDraft}
      />
      {#if filterOperator === 'between'}
        <Input
          type={filterProperty.type === 'date' ? 'date' : 'number'}
          aria-label={`${filterProperty.label} end value`}
          bind:value={filterEndDraft}
        />
      {/if}
      <Button
        onclick={applyDraftFilter}
        disabled={!filterValueDraft.trim() ||
          (filterOperator === 'between' && !filterEndDraft.trim())}
        >Apply filter</Button
      >
    {/if}
  </div>
{/snippet}

{#snippet sortEditor()}
  <div class="grid gap-2" aria-label="Sort editor">
    {#if sortStep === 'property'}
      <p class="px-2 pt-1 text-xs font-medium text-muted-foreground">Sort by</p>
      {#each sortableProperties as property (property.key)}
        <Button
          variant="ghost"
          class="justify-start"
          onclick={() => selectSortProperty(property)}>{property.label}</Button
        >
      {/each}
    {:else if sortStep === 'direction'}
      <Button
        variant="ghost"
        class="justify-start text-muted-foreground"
        onclick={() => (sortStep = 'property')}>{sortProperty?.label}</Button
      >
      <Button
        variant="ghost"
        class="justify-start"
        onclick={() => addSort('asc')}
        >{directionLabels(sortProperty).asc}</Button
      >
      <Button
        variant="ghost"
        class="justify-start"
        onclick={() => addSort('desc')}
        >{directionLabels(sortProperty).desc}</Button
      >
    {:else}
      {#each query.sorts as sort, index (sort.property)}
        <div class="flex items-center gap-1 rounded-md border p-1">
          <span class="min-w-0 flex-1 truncate px-2 text-sm">
            {propertyFor(sort.property)?.label ?? sort.property}
            <span class="text-muted-foreground"
              >· {directionLabels(propertyFor(sort.property))[
                sort.direction
              ]}</span
            >
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${propertyFor(sort.property)?.label ?? sort.property} earlier`}
            disabled={index === 0}
            onclick={() => moveSort(index, -1)}><ChevronUpIcon /></Button
          >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${propertyFor(sort.property)?.label ?? sort.property} later`}
            disabled={index === query.sorts.length - 1}
            onclick={() => moveSort(index, 1)}><ChevronDownIcon /></Button
          >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${propertyFor(sort.property)?.label ?? sort.property} sort`}
            onclick={() => removeSort(sort.property)}><XIcon /></Button
          >
        </div>
      {/each}
      {#if sortableProperties.length}
        <Button
          variant="ghost"
          class="justify-start"
          onclick={() => (sortStep = 'property')}
          ><PlusIcon data-icon="inline-start" />Add sort</Button
        >
      {/if}
    {/if}
  </div>
{/snippet}

<div data-slot="data-view-toolbar" class="flex w-full flex-col gap-2">
  <div class="flex min-h-9 flex-wrap items-center justify-end gap-1">
    {#if isMobile.current}
      <Sheet.Root bind:open={filterOpen}>
        <Sheet.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.filters.length
                ? `Filter · ${query.filters.length}`
                : 'Filter'}
              ><ListFilterIcon data-icon="inline-start" />{query.filters.length
                ? `Filter · ${query.filters.length}`
                : 'Filter'}</Button
            >{/snippet}</Sheet.Trigger
        >
        <Sheet.Content side="bottom" class="max-h-[85vh] overflow-y-auto">
          <Sheet.Header
            ><Sheet.Title>Filter</Sheet.Title><Sheet.Description
              >Show items that match all selected rules.</Sheet.Description
            ></Sheet.Header
          >
          {@render filterEditor()}
        </Sheet.Content>
      </Sheet.Root>
    {:else}
      <Popover.Root bind:open={filterOpen}>
        <Popover.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.filters.length
                ? `Filter · ${query.filters.length}`
                : 'Filter'}
              ><ListFilterIcon data-icon="inline-start" />{query.filters.length
                ? `Filter · ${query.filters.length}`
                : 'Filter'}</Button
            >{/snippet}</Popover.Trigger
        >
        <Popover.Content align="end">{@render filterEditor()}</Popover.Content>
      </Popover.Root>
    {/if}

    {#if isMobile.current}
      <Sheet.Root bind:open={sortOpen}>
        <Sheet.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.sorts.length
                ? `Sort · ${query.sorts.length}`
                : 'Sort'}
              ><ArrowUpDownIcon data-icon="inline-start" />{query.sorts.length
                ? `Sort · ${query.sorts.length}`
                : 'Sort'}</Button
            >{/snippet}</Sheet.Trigger
        >
        <Sheet.Content side="bottom" class="max-h-[85vh] overflow-y-auto">
          <Sheet.Header
            ><Sheet.Title>Sort</Sheet.Title><Sheet.Description
              >Earlier rules have higher priority.</Sheet.Description
            ></Sheet.Header
          >
          {@render sortEditor()}
        </Sheet.Content>
      </Sheet.Root>
    {:else}
      <Popover.Root bind:open={sortOpen}>
        <Popover.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.sorts.length
                ? `Sort · ${query.sorts.length}`
                : 'Sort'}
              ><ArrowUpDownIcon data-icon="inline-start" />{query.sorts.length
                ? `Sort · ${query.sorts.length}`
                : 'Sort'}</Button
            >{/snippet}</Popover.Trigger
        >
        <Popover.Content align="end">{@render sortEditor()}</Popover.Content>
      </Popover.Root>
    {/if}

    {#if searchExpanded}
      <div class="flex min-w-52 flex-1 items-center gap-1 sm:max-w-80">
        <Input
          bind:ref={searchInput}
          type="search"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          bind:value={searchDraft}
          oninput={scheduleSearch}
          onkeydown={handleSearchKeydown}
        />
        {#if searchDraft}<Button
            variant="ghost"
            size="icon-sm"
            class="max-md:size-11"
            aria-label="Clear search"
            onclick={clearSearch}><XIcon /></Button
          >{/if}
      </div>
    {:else}
      <Button
        bind:ref={searchTrigger}
        variant="ghost"
        size="sm"
        aria-label={searchLabel}
        onclick={openSearch}
        ><SearchIcon data-icon="inline-start" />Search</Button
      >
    {/if}
  </div>

  {#if query.filters.length}
    <div class="flex flex-wrap items-center gap-1" aria-label="Active filters">
      {#each query.filters as filter (filter.property)}
        <div
          class="inline-flex h-8 items-center rounded-md bg-secondary pl-2 text-xs text-secondary-foreground"
        >
          <span>{filterSummary(filter)}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${propertyFor(filter.property)?.label ?? filter.property} filter`}
            onclick={() => removeFilter(filter.property)}><XIcon /></Button
          >
        </div>
      {/each}
    </div>
  {/if}
</div>
