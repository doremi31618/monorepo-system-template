<script lang="ts">
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
  import { tick, type Snippet } from 'svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
  import { Button } from '$lib/ui/button/index.js';
  import * as Drawer from '$lib/ui/drawer/index.js';
  import { Input } from '$lib/ui/input/index.js';
  import * as Popover from '$lib/ui/popover/index.js';
  import {
    defaultDataViewToolbarLabels,
    type DataViewToolbarLabelOverrides,
  } from './labels.js';
  import type {
    DataViewFilterOperator,
    DataViewFilterEditorContext,
    DataViewFilterRule,
    DataViewOption,
    DataViewProperty,
    DataViewQuery,
    DataViewSortRule,
  } from './query.js';

  let {
    properties,
    query,
    searchLabel,
    searchPlaceholder,
    searchMode = 'toggle',
    labels = {},
    filterEditors = {},
    onquerychange,
  }: {
    properties: DataViewProperty[];
    query: DataViewQuery;
    searchLabel?: string;
    searchPlaceholder?: string;
    searchMode?: 'toggle' | 'persistent';
    labels?: DataViewToolbarLabelOverrides;
    filterEditors?: Record<
      string,
      Snippet<[context: DataViewFilterEditorContext]>
    >;
    onquerychange?: (query: DataViewQuery) => void;
  } = $props();

  const isMobile = new IsMobile();
  const copy = $derived({
    ...defaultDataViewToolbarLabels,
    ...labels,
    operators: {
      ...defaultDataViewToolbarLabels.operators,
      ...labels.operators,
    },
  });
  const effectiveSearchLabel = $derived(searchLabel ?? copy.search);
  const effectiveSearchPlaceholder = $derived(
    searchPlaceholder ?? copy.searchPlaceholder,
  );

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
  let filterOptionDraft = $state<string[]>([]);
  let filterOptionSearch = $state('');
  let filterOptions = $state<DataViewOption[]>([]);
  let filterOptionNextCursor = $state<string | undefined>();
  let filterOptionLoading = $state(false);
  let filterOptionError = $state('');
  let filterOptionVisibleCount = $state(10);
  let filterOptionController: AbortController | undefined;
  const optionLabelCache = new Map<string, string>();
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
    if (!filterOpen) resetFilterEditor();
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
    else if (searchMode !== 'persistent') void closeSearch();
  }

  function resetFilterEditor() {
    filterOptionController?.abort();
    filterProperty = undefined;
    filterOperator = undefined;
    filterValueDraft = '';
    filterEndDraft = '';
    filterOptionDraft = [];
    filterOptionSearch = '';
    filterOptions = [];
    filterOptionNextCursor = undefined;
    filterOptionLoading = false;
    filterOptionError = '';
    filterOptionVisibleCount = 10;
  }
  function selectFilterProperty(property: DataViewProperty) {
    resetFilterEditor();
    filterProperty = property;
  }
  function selectFilterOperator(operator: DataViewFilterOperator) {
    filterOperator = operator;
    const existing = query.filters.find(
      (filter) => filter.property === filterProperty?.key,
    );
    if (existing && existing.operator === operator) {
      const values = Array.isArray(existing.value)
        ? existing.value
        : [existing.value];
      if (isChoiceProperty(filterProperty)) filterOptionDraft = values;
      else {
        filterValueDraft = values[0] ?? '';
        filterEndDraft = values[1] ?? '';
      }
    }
    if (isChoiceProperty(filterProperty)) void loadFilterOptions(true);
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
      filterOptionDraft = [value];
      return;
    }
    filterOptionDraft = filterOptionDraft.includes(value)
      ? filterOptionDraft.filter((item) => item !== value)
      : [...filterOptionDraft, value];
  }
  function canConfirmFilter() {
    if (!filterProperty || !filterOperator) return false;
    if (isChoiceProperty(filterProperty)) return filterOptionDraft.length > 0;
    if (!filterValueDraft.trim()) return false;
    return filterOperator !== 'between' || Boolean(filterEndDraft.trim());
  }
  function confirmFilter() {
    if (!canConfirmFilter()) return;
    const value = isChoiceProperty(filterProperty)
      ? filterOperator === 'isAnyOf'
        ? filterOptionDraft
        : filterOptionDraft[0]
      : filterOperator === 'between'
        ? [filterValueDraft.trim(), filterEndDraft.trim()]
        : filterValueDraft.trim();
    commitFilter(value);
    filterOpen = false;
  }
  function editFilter(filter: DataViewFilterRule) {
    resetFilterEditor();
    filterProperty = propertyFor(filter.property);
    if (!filterProperty) return;

    filterOperator = filter.operator;
    const values = Array.isArray(filter.value)
      ? filter.value
      : [filter.value];
    if (isChoiceProperty(filterProperty)) filterOptionDraft = values;
    else {
      filterValueDraft = values[0] ?? '';
      filterEndDraft = values[1] ?? '';
    }
    filterOpen = true;
    if (isChoiceProperty(filterProperty)) void loadFilterOptions(true);
  }
  function removeFilter(property: string) {
    emit({
      ...query,
      filters: query.filters.filter((filter) => filter.property !== property),
    });
  }
  function clearFilters() {
    emit({ ...query, filters: [] });
  }
  function propertyFor(key: string) {
    return properties.find((property) => property.key === key);
  }
  function optionLabel(property: DataViewProperty | undefined, value: string) {
    return (
      property?.options?.find((option) => option.value === value)?.label ??
      optionLabelCache.get(`${property?.key}:${value}`) ??
      value
    );
  }
  function isChoiceProperty(property: DataViewProperty | undefined) {
    return Boolean(
      property &&
        (property.type === 'enum' ||
          property.type === 'relation' ||
          property.type === 'boolean' ||
          property.options?.length ||
          property.loadOptions),
    );
  }
  function staticOptions(property: DataViewProperty | undefined) {
    if (!property) return [];
    if (property.options?.length) return property.options;
    if (property.type === 'boolean')
      return [
        { value: 'true', label: copy.booleanTrue },
        { value: 'false', label: copy.booleanFalse },
      ];
    return [];
  }
  function visibleFilterOptions() {
    if (filterProperty?.loadOptions) return filterOptions;
    const search = filterOptionSearch.trim().toLowerCase();
    return staticOptions(filterProperty)
      .filter((option) => option.label.toLowerCase().includes(search))
      .slice(0, filterOptionVisibleCount);
  }
  async function loadFilterOptions(reset: boolean) {
    const property = filterProperty;
    if (!property?.loadOptions) {
      filterOptions = staticOptions(property);
      return;
    }
    if (!reset && (filterOptionLoading || !filterOptionNextCursor)) return;

    if (reset) {
      filterOptionController?.abort();
      filterOptions = [];
      filterOptionNextCursor = undefined;
    }
    const controller = new AbortController();
    filterOptionController = controller;
    filterOptionLoading = true;
    filterOptionError = '';
    try {
      const page = await property.loadOptions({
        search: filterOptionSearch.trim(),
        cursor: reset ? undefined : filterOptionNextCursor,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      for (const option of page.items) {
        optionLabelCache.set(`${property.key}:${option.value}`, option.label);
      }
      filterOptions = reset ? page.items : [...filterOptions, ...page.items];
      filterOptionNextCursor = page.nextCursor;
    } catch (error) {
      if (controller.signal.aborted) return;
      filterOptionError =
        error instanceof Error ? error.message : 'Unable to load options';
    } finally {
      if (!controller.signal.aborted) filterOptionLoading = false;
    }
  }
  function handleFilterOptionSearch() {
    filterOptionVisibleCount = 10;
    if (filterProperty?.loadOptions) void loadFilterOptions(true);
  }
  function handleFilterOptionScroll(event: Event) {
    const target = event.currentTarget as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight > 24)
      return;
    if (filterProperty?.loadOptions) void loadFilterOptions(false);
    else filterOptionVisibleCount += 10;
  }
  function filterEditorContext(): DataViewFilterEditorContext {
    if (!filterProperty || !filterOperator)
      throw new Error('Filter editor context requires a property and operator');
    return {
      property: filterProperty,
      operator: filterOperator,
      value: filterValueDraft,
      endValue: filterEndDraft,
      selectedValues: filterOptionDraft,
      setValue: (value) => (filterValueDraft = value),
      setEndValue: (value) => (filterEndDraft = value),
      setSelectedValues: (values) => (filterOptionDraft = values),
    };
  }
  function filterSummary(filter: DataViewFilterRule) {
    const property = propertyFor(filter.property);
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    return `${property?.label ?? filter.property} ${copy.operators[filter.operator]} ${values.map((value) => optionLabel(property, value)).join(', ')}`;
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
        {copy.filterBy}
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
          onclick={() => selectFilterOperator(operator)}
          >{copy.operators[operator]}</Button
        >
      {/each}
    {:else if isChoiceProperty(filterProperty)}
      <p class="px-2 pt-1 text-xs text-muted-foreground">
        {filterProperty.label}
        {copy.operators[filterOperator]}
      </p>
      {#if filterProperty.type !== 'boolean'}
        <Input
          type="search"
          aria-label={`Search ${filterProperty.label} options`}
          placeholder={copy.searchOptionsPlaceholder}
          bind:value={filterOptionSearch}
          oninput={handleFilterOptionSearch}
        />
      {/if}
      <div
        class="grid max-h-64 gap-1 overflow-y-auto"
        aria-label={`${filterProperty.label} options`}
        onscroll={handleFilterOptionScroll}
      >
        {#each visibleFilterOptions() as option (option.value)}
          <Button
            variant={filterOptionDraft.includes(option.value)
              ? 'secondary'
              : 'ghost'}
            class="justify-start"
            aria-pressed={filterOptionDraft.includes(option.value)}
            onclick={() => toggleFilterOption(option.value)}
            >{option.label}</Button
          >
        {/each}
        {#if filterOptionLoading}
          <p class="px-2 py-3 text-sm text-muted-foreground" role="status">
            {copy.loadingOptions}
          </p>
        {:else if filterOptionError}
          <div class="grid gap-2 px-2 py-3" role="alert">
            <p class="text-sm text-destructive">{filterOptionError}</p>
            <Button variant="outline" size="sm" onclick={() => loadFilterOptions(true)}
              >{copy.retry}</Button
            >
          </div>
        {:else if !visibleFilterOptions().length}
          <p class="px-2 py-3 text-sm text-muted-foreground">{copy.noOptions}</p>
        {/if}
      </div>
    {:else if filterEditors[filterProperty.type]}
      {@const editor = filterEditors[filterProperty.type]}
      <p class="px-2 pt-1 text-xs text-muted-foreground">
        {filterProperty.label}
        {copy.operators[filterOperator]}
      </p>
      {@render editor(filterEditorContext())}
    {:else}
      <p class="px-2 pt-1 text-xs text-muted-foreground">
        {filterProperty.label}
        {copy.operators[filterOperator]}
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
    {/if}
    {#if filterProperty && filterOperator}
      <div class="flex items-center justify-end gap-2 pt-2">
        <Button onclick={confirmFilter} disabled={!canConfirmFilter()}
          >{copy.confirmFilter}</Button
        >
      </div>
    {/if}
  </div>
{/snippet}

{#snippet sortEditor()}
  <div class="grid gap-2" aria-label="Sort editor">
    {#if sortStep === 'property'}
      <p class="px-2 pt-1 text-xs font-medium text-muted-foreground">{copy.sortBy}</p>
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
          ><PlusIcon data-icon="inline-start" />{copy.addSort}</Button
        >
      {/if}
    {/if}
  </div>
{/snippet}

<div data-slot="data-view-toolbar" class="flex w-full flex-col gap-2">
  <div class="flex min-h-9 flex-wrap items-center justify-end gap-1">
    {#if isMobile.current}
      <Drawer.Root bind:open={filterOpen}>
        <Drawer.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={copy.addFilter}
              ><PlusIcon data-icon="inline-start" />{copy.addFilter}</Button
            >{/snippet}</Drawer.Trigger
        >
        <Drawer.Content class="max-h-[85dvh]">
          <Drawer.Header
            ><Drawer.Title>{copy.filter}</Drawer.Title><Drawer.Description
              >{copy.filterDescription}</Drawer.Description
            ></Drawer.Header
          >
          <div class="overflow-y-auto px-4 pb-4">{@render filterEditor()}</div>
        </Drawer.Content>
      </Drawer.Root>
    {:else}
      <Popover.Root bind:open={filterOpen}>
        <Popover.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={copy.addFilter}
              ><PlusIcon data-icon="inline-start" />{copy.addFilter}</Button
            >{/snippet}</Popover.Trigger
        >
        <Popover.Content align="end">{@render filterEditor()}</Popover.Content>
      </Popover.Root>
    {/if}

    {#if isMobile.current}
      <Drawer.Root bind:open={sortOpen}>
        <Drawer.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.sorts.length
                ? `${copy.sort} · ${query.sorts.length}`
                : copy.sort}
              ><ArrowUpDownIcon data-icon="inline-start" />{query.sorts.length
                ? `${copy.sort} · ${query.sorts.length}`
                : copy.sort}</Button
            >{/snippet}</Drawer.Trigger
        >
        <Drawer.Content class="max-h-[85dvh]">
          <Drawer.Header
            ><Drawer.Title>{copy.sort}</Drawer.Title><Drawer.Description
              >{copy.sortDescription}</Drawer.Description
            ></Drawer.Header
          >
          <div class="overflow-y-auto px-4 pb-4">{@render sortEditor()}</div>
        </Drawer.Content>
      </Drawer.Root>
    {:else}
      <Popover.Root bind:open={sortOpen}>
        <Popover.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              aria-label={query.sorts.length
                ? `${copy.sort} · ${query.sorts.length}`
                : copy.sort}
              ><ArrowUpDownIcon data-icon="inline-start" />{query.sorts.length
                ? `${copy.sort} · ${query.sorts.length}`
                : copy.sort}</Button
            >{/snippet}</Popover.Trigger
        >
        <Popover.Content align="end">{@render sortEditor()}</Popover.Content>
      </Popover.Root>
    {/if}

    {#if searchMode === 'persistent' || searchExpanded}
      <div class="flex min-w-52 flex-1 items-center gap-1 sm:max-w-80">
        <Input
          bind:ref={searchInput}
          type="search"
          aria-label={effectiveSearchLabel}
          placeholder={effectiveSearchPlaceholder}
          bind:value={searchDraft}
          oninput={scheduleSearch}
          onkeydown={handleSearchKeydown}
        />
        {#if searchDraft}<Button
            variant="ghost"
            size="icon-sm"
            class="max-md:size-11"
            aria-label={copy.clearSearch}
            onclick={clearSearch}><XIcon /></Button
          >{/if}
      </div>
    {:else}
      <Button
        bind:ref={searchTrigger}
        variant="ghost"
        size="sm"
        aria-label={effectiveSearchLabel}
        onclick={openSearch}
        ><SearchIcon data-icon="inline-start" />{copy.search}</Button
      >
    {/if}
  </div>

  {#if query.filters.length}
    <div class="flex flex-wrap items-center gap-1" aria-label="Active filters">
      {#each query.filters as filter (filter.property)}
        <div class="inline-flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Edit filter: ${filterSummary(filter)}`}
            onclick={() => editFilter(filter)}
            >{filterSummary(filter)}</Button
          >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${propertyFor(filter.property)?.label ?? filter.property} filter`}
            onclick={() => removeFilter(filter.property)}><XIcon /></Button
          >
        </div>
      {/each}
      <Button
        variant="ghost"
        size="sm"
        aria-label={`${copy.clearAll} filters`}
        onclick={clearFilters}>{copy.clearAll}</Button
      >
    </div>
  {/if}
</div>
