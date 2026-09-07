<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    DataViewToolbar,
    type DataViewFilterEditorContext,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';
  import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI Library/Data View Toolbar',
    component: DataViewToolbar,
    parameters: { layout: 'padded' },
  });

  const properties: DataViewProperty[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'enum',
      operators: ['is', 'isNot', 'isAnyOf'],
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      operators: ['before', 'after', 'between'],
      sortable: true,
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      operators: ['is', 'isNot'],
      sortable: true,
    },
  ];

  const relationOptions = [
    { value: 'acme', label: 'Acme' },
    { value: 'globex', label: 'Globex' },
    { value: 'initech', label: 'Initech' },
  ];
  const asyncProperties: DataViewProperty[] = [
    {
      key: 'provider',
      label: 'Provider',
      type: 'relation',
      operators: ['is', 'isAnyOf'],
      loadOptions: async ({ search, cursor, signal }) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 10);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
        const matching = relationOptions.filter((option) =>
          option.label.toLowerCase().includes(search.toLowerCase()),
        );
        const offset = cursor ? Number(cursor) : 0;
        const items = matching.slice(offset, offset + 2);
        const nextOffset = offset + items.length;
        return {
          items,
          nextCursor: nextOffset < matching.length ? String(nextOffset) : undefined,
        };
      },
    },
  ];
  const customProperties: DataViewProperty[] = [
    {
      key: 'budget',
      label: 'Budget',
      type: 'currency',
      operators: ['is', 'between'],
    },
  ];
  const datatypeProperties: DataViewProperty[] = [
    { key: 'name', label: 'Name', type: 'text', operators: ['is'] },
    { key: 'score', label: 'Score', type: 'number', operators: ['is', 'between'] },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      operators: ['before', 'between'],
    },
    { key: 'active', label: 'Active', type: 'boolean', operators: ['is'] },
  ];
</script>

<script lang="ts">
  let query = $state<DataViewQuery>({ search: '', filters: [], sorts: [] });
  let asyncQuery = $state<DataViewQuery>({
    search: '',
    filters: [],
    sorts: [],
  });
  let customQuery = $state<DataViewQuery>({
    search: '',
    filters: [],
    sorts: [],
  });
  let datatypeQuery = $state<DataViewQuery>({
    search: '',
    filters: [],
    sorts: [],
  });
</script>

{#snippet currencyEditor(context: DataViewFilterEditorContext)}
  <input
    type="number"
    aria-label="Budget amount"
    value={context.value}
    oninput={(event) => context.setValue((event.currentTarget as HTMLInputElement).value)}
  />
{/snippet}

{#snippet viewActions()}
  <button type="button">View mode</button>
{/snippet}

<Story
  name="Search interaction"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Search posts' }));

    const input = canvas.getByRole('searchbox', { name: 'Search posts' });
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'roadmap');
    await waitFor(() => expect(canvas.getByTestId('search-state')).toHaveTextContent('roadmap'));

    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByTestId('search-state')).toHaveTextContent('empty');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('searchbox', { name: 'Search posts' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Search posts' })).toHaveFocus();
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      {query}
      searchLabel="Search posts"
      searchPlaceholder="Search title or slug…"
      onquerychange={(next) => (query = next)}
    />
    <output data-testid="search-state">{query.search || 'empty'}</output>
  </div>
</Story>

<Story
  name="Persistent localized search"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole('searchbox', { name: '搜尋資料' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '新增篩選' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'View mode' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '排序' }));
    await userEvent.click(body.getByRole('button', { name: 'Updated' }));
    await expect(body.getByRole('button', { name: '最新優先' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  }}
>
  <DataViewToolbar
    {properties}
    {query}
    searchMode="persistent"
    labels={{
      addFilter: '新增篩選',
      search: '搜尋資料',
      sort: '排序',
      newestFirst: '最新優先',
    }}
    actions={viewActions}
    onquerychange={(next) => (query = next)}
  />
</Story>

<Story
  name="Built-in datatype editors"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Active' }));
    await userEvent.click(body.getByRole('button', { name: 'is' }));
    await expect(body.getByRole('button', { name: 'True' })).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Score' }));
    await userEvent.click(body.getByRole('button', { name: 'between' }));
    await expect(body.getByRole('spinbutton', { name: 'Score value' })).toBeVisible();
    await expect(body.getByRole('spinbutton', { name: 'Score end value' })).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Created' }));
    await userEvent.click(body.getByRole('button', { name: 'between' }));
    await expect(body.getByLabelText('Created value')).toHaveAttribute('type', 'date');
    await expect(body.getByLabelText('Created end value')).toHaveAttribute('type', 'date');
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Name' }));
    await userEvent.click(body.getByRole('button', { name: 'is' }));
    await expect(body.getByRole('textbox', { name: 'Name value' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  }}
>
  <DataViewToolbar
    properties={datatypeProperties}
    query={datatypeQuery}
    onquerychange={(next) => (datatypeQuery = next)}
  />
</Story>

<Story
  name="Custom datatype editor"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.queryByRole('button', { name: 'Sort' })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Budget' }));
    await userEvent.click(body.getByRole('button', { name: 'is' }));
    await userEvent.type(body.getByRole('spinbutton', { name: 'Budget amount' }), '42');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('custom-filter-state')).toHaveTextContent('budget:42');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={customProperties}
      query={customQuery}
      filterEditors={{ currency: currencyEditor }}
      onquerychange={(next) => (customQuery = next)}
    />
    <output data-testid="custom-filter-state">
      {customQuery.filters.map((filter) => `${filter.property}:${filter.value}`).join('|') ||
        'empty'}
    </output>
  </div>
</Story>

<Story
  name="Async relation options"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Provider' }));
    await userEvent.click(body.getByRole('button', { name: 'is any of' }));
    await expect(await body.findByRole('button', { name: 'Acme' })).toBeVisible();
    await fireEvent.scroll(body.getByLabelText('Provider options'));
    await expect(await body.findByRole('button', { name: 'Initech' })).toBeVisible();

    const optionSearch = body.getByRole('searchbox', {
      name: 'Search Provider options',
    });
    await userEvent.type(optionSearch, 'glob');
    await expect(await body.findByRole('button', { name: 'Globex' })).toBeVisible();
    await userEvent.click(body.getByRole('button', { name: 'Globex' }));
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('async-filter-state')).toHaveTextContent('provider:globex');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={asyncProperties}
      query={asyncQuery}
      onquerychange={(next) => (asyncQuery = next)}
    />
    <output data-testid="async-filter-state">
      {asyncQuery.filters
        .map(
          (filter) =>
            `${filter.property}:${Array.isArray(filter.value) ? filter.value.join(',') : filter.value}`,
        )
        .join('|') || 'empty'}
    </output>
  </div>
</Story>

<Story
  name="Mobile filter drawer"
  asChild
  parameters={{ viewport: { defaultViewport: 'mobile1' } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    const drawer = body.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-vaul-drawer');
    await expect(body.getByRole('heading', { name: 'Filter' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  }}
>
  <DataViewToolbar
    {properties}
    {query}
    searchLabel="Search posts"
    searchPlaceholder="Search title or slug…"
    onquerychange={(next) => (query = next)}
  />
</Story>

<Story
  name="Filter and ordered sort"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Status' }));
    await userEvent.click(body.getByRole('button', { name: 'is any of' }));
    await userEvent.click(body.getByRole('button', { name: 'Draft' }));
    await expect(canvas.getByTestId('filter-state')).toHaveTextContent('empty');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByText('Status is any of Draft')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add filter' })).toBeVisible();
    const appliedFilter = canvas.getByRole('button', {
      name: 'Edit filter: Status is any of Draft',
    });
    await expect(appliedFilter).toBeVisible();
    await userEvent.click(appliedFilter);
    await expect(body.getByRole('button', { name: 'Draft' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Status filter' }));
    await expect(canvas.getByTestId('filter-state')).toHaveTextContent('empty');

    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await userEvent.click(body.getByRole('button', { name: 'Status' }));
    await userEvent.click(body.getByRole('button', { name: 'is any of' }));
    await userEvent.click(body.getByRole('button', { name: 'Published' }));
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all filters' }));
    await expect(canvas.getByTestId('filter-state')).toHaveTextContent('empty');

    await userEvent.click(canvas.getByRole('button', { name: 'Sort' }));
    await userEvent.click(body.getByRole('button', { name: 'Updated' }));
    await userEvent.click(body.getByRole('button', { name: 'Newest first' }));
    await expect(canvas.getByRole('button', { name: 'Sort · 1' })).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Add sort' }));
    await userEvent.click(body.getByRole('button', { name: 'Title' }));
    await userEvent.click(body.getByRole('button', { name: 'A–Z' }));
    await expect(canvas.getByRole('button', { name: 'Sort · 2' })).toBeVisible();

    await userEvent.click(body.getByRole('button', { name: 'Move Title earlier' }));
    await expect(canvas.getByTestId('sort-state')).toHaveTextContent('title:asc,updatedAt:desc');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      {query}
      searchLabel="Search posts"
      searchPlaceholder="Search title or slug…"
      onquerychange={(next) => (query = next)}
    />
    <output data-testid="sort-state">
      {query.sorts.map((sort) => `${sort.property}:${sort.direction}`).join(',') || 'empty'}
    </output>
    <output data-testid="filter-state">
      {query.filters.map((filter) => filter.property).join(',') || 'empty'}
    </output>
  </div>
</Story>
