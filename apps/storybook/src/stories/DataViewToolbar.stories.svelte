<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    DataViewToolbar,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';
  import { expect, userEvent, waitFor, within } from 'storybook/test';

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
</script>

<script lang="ts">
  let query = $state<DataViewQuery>({ search: '', filters: [], sorts: [] });
</script>

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
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Status filter' }),
    );
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
