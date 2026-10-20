<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    DataViewToolbar,
    type DataViewFilterEditorContext,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';
  import { expect, userEvent, waitFor, within } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI Library/Data View Toolbar/Operators and repeated rules',
    component: DataViewToolbar,
    parameters: { layout: 'padded' },
  });

  const longLabel = `${'Very long option label '.repeat(4)}ends here`.slice(0, 100);
  const properties: DataViewProperty[] = [
    {
      key: 'note',
      label: 'Note',
      type: 'text',
      operators: ['contains', 'isEmpty'],
      allowRepeat: true,
      maxRules: 3,
      operatorMeta: {
        contains: { operand: 'single' },
        isEmpty: { operand: 'none', label: 'is empty' },
      },
    },
    {
      key: 'category',
      label: 'Category',
      type: 'enum',
      operators: ['containsAny', 'is'],
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
        { value: 'long', label: longLabel },
      ],
      operatorMeta: {
        containsAny: { operand: 'multi', label: 'contains any of' },
      },
    },
  ];
  const empty = (): DataViewQuery => ({ search: '', filters: [], sorts: [] });
  const ownerLoads = { count: 0 };
  const extraProperties: DataViewProperty[] = [
    {
      key: 'codes',
      label: 'Codes',
      type: 'codes',
      operators: ['inAny'],
      operatorMeta: { inAny: { operand: 'multi', label: 'in any of' } },
    },
    {
      key: 'owner',
      label: 'Owner',
      type: 'relation',
      operators: ['is', 'isEmpty'],
      operatorMeta: { isEmpty: { operand: 'none', label: 'has no owner' } },
      loadOptions: async () => {
        ownerLoads.count += 1;
        return { items: [{ value: 'u1', label: 'User One' }] };
      },
    },
    { key: 'updated', label: 'Updated', type: 'date', operators: [], sortable: true },
  ];
  const desktop = { width: 1024, height: 768 };
  const phone = { width: 375, height: 667 };
  const singleRuleProperties: DataViewProperty[] = [
    { key: 'title', label: 'Title', type: 'text', operators: ['contains'] },
    { key: 'owner', label: 'Owner', type: 'text', operators: ['contains'] },
  ];
  // Consumer-style normalizers: the package itself knows no whitespace rules.
  const keepText = (raw: string) => raw;
  const asciiEdges = /^[\t\n\v\f\r \x1c-\x1f\x85]+|[\t\n\v\f\r \x1c-\x1f\x85]+$/g;
  const stripAsciiEdges = (raw: string) => raw.replace(asciiEdges, '');
  const normalizedProperties = (
    normalizeText: (raw: string) => string,
  ): DataViewProperty[] => [
    {
      key: 'code',
      label: 'Code',
      type: 'text',
      operators: ['contains'],
      allowRepeat: true,
      operatorMeta: { contains: { operand: 'single' } },
      normalizeText,
    },
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'pattern',
      operators: ['matches', 'between'],
      operatorMeta: { matches: { operand: 'single' } },
      normalizeText,
    },
  ];
  const feff = '﻿';
  /** Escapes non-printable-ASCII so FEFF survives text matchers' whitespace collapsing. */
  const exact = (value: DataViewQuery) =>
    value.filters
      .map((rule) => `${rule.property}:${JSON.stringify(rule.value)}`)
      .join('|')
      .replace(
        /[^\x21-\x7e]/g,
        (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
      ) || 'empty';

  /** Resizes the test iframe under Vitest browser mode; a no-op elsewhere. */
  async function setViewport(size: { width: number; height: number }) {
    if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__)
      return false;
    const { page } = await import('vitest/browser');
    await page.viewport(size.width, size.height);
    return true;
  }

  async function openFilter(canvasElement: HTMLElement) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    return within(canvasElement.ownerDocument.body);
  }
</script>

<script lang="ts">
  let query = $state<DataViewQuery>(empty());
  let mobileQuery = $state<DataViewQuery>(empty());
  let duplicateQuery = $state<DataViewQuery>({
    search: '',
    filters: [
      { id: 'dup', property: 'note', operator: 'contains', value: 'one' },
      { id: 'dup', property: 'note', operator: 'contains', value: 'two' },
      { id: 'dup', property: 'category', operator: 'is', value: 'a' },
    ],
    sorts: [],
  });
  let rehydratedQuery = $state<DataViewQuery>({
    search: '',
    filters: [
      { id: 'note-1', property: 'note', operator: 'isEmpty', value: '' },
      { id: 'rule-0-1', property: 'note', operator: 'contains', value: 'old' },
    ],
    sorts: [],
  });
  let chipQuery = $state<DataViewQuery>({
    search: '',
    filters: [{ id: 'n1', property: 'note', operator: 'contains', value: 'foo' }],
    sorts: [],
  });
  let extraQuery = $state<DataViewQuery>(empty());
  let idlessQuery = $state<DataViewQuery>({
    search: '',
    filters: [
      { property: 'note', operator: 'contains', value: 'same' },
      { property: 'note', operator: 'contains', value: 'same' },
    ],
    sorts: [],
  });
  let idlessEmits = $state(0);
  let defaultTrimQuery = $state<DataViewQuery>(empty());
  let keepQuery = $state<DataViewQuery>(empty());
  let stripQuery = $state<DataViewQuery>(empty());
  let patternQuery = $state<DataViewQuery>(empty());
  let appIdQuery = $state<DataViewQuery>({
    search: '',
    filters: [{ id: 'app-7', property: 'title', operator: 'contains', value: 'foo' }],
    sorts: [],
  });
  let legacyOrderQuery = $state<DataViewQuery>({
    search: '',
    filters: [
      { property: 'title', operator: 'contains', value: 'a' },
      { property: 'owner', operator: 'contains', value: 'b' },
    ],
    sorts: [],
  });
  // Simulates a parent that rehydrates its query (new rule objects, no ids).
  $effect(() => {
    const rehydrate = () => (idlessQuery = structuredClone($state.snapshot(idlessQuery)));
    window.addEventListener('m404-rehydrate', rehydrate);
    return () => window.removeEventListener('m404-rehydrate', rehydrate);
  });
  const rules = (value: DataViewQuery) =>
    value.filters
      .map((rule) => `${rule.property}:${rule.operator}:${JSON.stringify(rule.value)}`)
      .join('|') || 'empty';
  const ids = (value: DataViewQuery) =>
    value.filters.map((rule) => rule.id ?? '-').join('|');
</script>

{#snippet codesEditor(context: DataViewFilterEditorContext)}
  <p data-testid="codes-operand">{context.operand}</p>
  <input
    aria-label="Codes list"
    value={context.selectedValues.join(',')}
    oninput={(event) =>
      context.setSelectedValues(
        event.currentTarget.value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      )}
  />
{/snippet}

{#snippet patternEditor(context: DataViewFilterEditorContext)}
  <input
    aria-label="Pattern value"
    value={context.value}
    oninput={(event) => context.setValue(event.currentTarget.value)}
  />
  {#if context.operator === 'between'}
    <input
      aria-label="Pattern end"
      value={context.endValue}
      oninput={(event) => context.setEndValue(event.currentTarget.value)}
    />
  {/if}
{/snippet}

<Story
  name="Unary operator hides the value editor"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'is empty' }));
    await expect(body.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(canvas.getByTestId('state')).toHaveTextContent('empty');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:isEmpty:""');
    await expect(canvas.getByRole('button', { name: 'Edit filter: Note is empty' })).toBeVisible();
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar {properties} {query} onquerychange={(next) => (query = next)} />
    <output data-testid="state">{rules(query)}</output>
  </div>
</Story>

<Story
  name="Multi operator selects several options"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Category' }));
    await userEvent.click(body.getByRole('button', { name: 'contains any of' }));
    await userEvent.click(body.getByRole('button', { name: 'Alpha' }));
    await userEvent.click(body.getByRole('button', { name: 'Beta' }));
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('category:containsAny:["a","b"]');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar {properties} {query} onquerychange={(next) => (query = next)} />
    <output data-testid="state">{rules(query)}</output>
  </div>
</Story>

<Story
  name="Cancel and Escape discard the draft"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'is empty' }));
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Add filter' })).toHaveFocus();
    await expect(canvas.getByTestId('state')).toHaveTextContent('empty');

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'is empty' }));
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByTestId('state')).toHaveTextContent('empty');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar {properties} {query} onquerychange={(next) => (query = next)} />
    <output data-testid="state">{rules(query)}</output>
  </div>
</Story>

<Story
  name="Repeated rules edit and remove independently"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'is empty' }));
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Note value' }), 'foo');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:isEmpty:""|note:contains:"foo"',
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Note contains foo' }));
    const input = body.getByRole('textbox', { name: 'Note value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'bar');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:isEmpty:""|note:contains:"bar"',
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Note is empty' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:contains:"bar"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar {properties} {query} onquerychange={(next) => (query = next)} />
    <output data-testid="state">{rules(query)}</output>
  </div>
</Story>

<Story
  name="Mobile drawer with a 100 character option"
  asChild
  parameters={{ viewport: { defaultViewport: 'mobile1' } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = await openFilter(canvasElement);
    await expect(body.getByRole('heading', { name: 'Filter' })).toBeVisible();
    await userEvent.click(body.getByRole('button', { name: 'Category' }));
    await userEvent.click(body.getByRole('button', { name: 'contains any of' }));
    const option = body.getByRole('button', { name: longLabel });
    await expect(option).toBeVisible();
    const dialog = body.getByRole('dialog');
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    await userEvent.click(option);
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('category:containsAny:["long"]');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Add filter' })).toHaveFocus();
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={mobileQuery}
      onquerychange={(next) => (mobileQuery = next)}
    />
    <output data-testid="state">{rules(mobileQuery)}</output>
  </div>
</Story>

<Story
  name="Duplicate ids edit and remove only the targeted sibling"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole('button', { name: 'Edit filter: Category is Alpha' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Note contains one' }));
    const input = body.getByRole('textbox', { name: 'Note value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'uno');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:contains:"uno"|note:contains:"two"|category:is:"a"',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Note contains two' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:contains:"uno"|category:is:"a"',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Category filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:contains:"uno"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={duplicateQuery}
      onquerychange={(next) => (duplicateQuery = next)}
    />
    <output data-testid="state">{rules(duplicateQuery)}</output>
  </div>
</Story>

<Story
  name="New rule ids stay unique after rehydration"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const now = Date.now;
    Date.now = () => 0;
    try {
      const body = await openFilter(canvasElement);
      await userEvent.click(body.getByRole('button', { name: 'Note' }));
      await userEvent.click(body.getByRole('button', { name: 'contains' }));
      await userEvent.type(body.getByRole('textbox', { name: 'Note value' }), 'new');
      await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    } finally {
      Date.now = now;
    }
    await expect(canvas.getByTestId('ids')).toHaveTextContent('note-1|rule-0-1|note-2');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Note contains new' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:isEmpty:""|note:contains:"old"',
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={rehydratedQuery}
      onquerychange={(next) => (rehydratedQuery = next)}
    />
    <output data-testid="state">{rules(rehydratedQuery)}</output>
    <output data-testid="ids">{ids(rehydratedQuery)}</output>
  </div>
</Story>

<Story
  name="Open chip draft survives desktop and mobile breakpoint changes"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const drawer = () => canvasElement.ownerDocument.querySelector('[data-vaul-drawer]');
    if (!(await setViewport(desktop))) return;

    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Note contains foo' }));
    const input = body.getByRole('textbox', { name: 'Note value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'draft');

    await setViewport(phone);
    await waitFor(() => expect(drawer()).not.toBeNull());
    await expect(body.getByRole('textbox', { name: 'Note value' })).toHaveValue('draft');

    await setViewport(desktop);
    await waitFor(() => expect(drawer()).toBeNull());
    await expect(await body.findByRole('textbox', { name: 'Note value' })).toHaveValue('draft');
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:contains:"foo"');

    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:contains:"draft"');
    const chip = canvas.getByRole('button', { name: 'Edit filter: Note contains draft' });
    await waitFor(() => expect(chip).toHaveFocus());
    await waitFor(
      () => expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe('none'),
      { timeout: 3000 },
    );

    await setViewport(phone);
    await userEvent.click(chip);
    await waitFor(() => expect(drawer()).not.toBeNull());
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(drawer()).toBeNull());
    await waitFor(() => expect(chip).toHaveFocus());
    await expect(canvas.getByTestId('state')).toHaveTextContent('note:contains:"draft"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={chipQuery}
      onquerychange={(next) => (chipQuery = next)}
    />
    <output data-testid="state">{rules(chipQuery)}</output>
  </div>
</Story>

<Story
  name="Mobile sort drawer returns focus to the sort button"
  asChild
  parameters={{ viewport: { defaultViewport: 'mobile1' } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Sort' }));
    await userEvent.click(body.getByRole('button', { name: 'Updated' }));
    await userEvent.click(body.getByRole('button', { name: 'Newest first' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Sort · 1' })).toHaveFocus());
  }}
>
  <DataViewToolbar
    properties={extraProperties}
    query={extraQuery}
    onquerychange={(next) => (extraQuery = next)}
  />
</Story>

<Story
  name="Multi operand drives a custom editor's selected values"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Codes' }));
    await userEvent.click(body.getByRole('button', { name: 'in any of' }));
    await expect(body.getByTestId('codes-operand')).toHaveTextContent('multi');
    await userEvent.type(body.getByRole('textbox', { name: 'Codes list' }), 'a, b');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('codes:inAny:["a","b"]');

    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Codes in any of a, b' }));
    body = within(canvasElement.ownerDocument.body);
    const editor = body.getByRole('textbox', { name: 'Codes list' });
    await expect(editor).toHaveValue('a,b');
    await userEvent.type(editor, ',c');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('codes:inAny:["a","b","c"]');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={extraProperties}
      query={extraQuery}
      filterEditors={{ codes: codesEditor }}
      onquerychange={(next) => (extraQuery = next)}
    />
    <output data-testid="state">{rules(extraQuery)}</output>
  </div>
</Story>

<Story
  name="Unary relation operator does not load options"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    ownerLoads.count = 0;
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Owner' }));
    await userEvent.click(body.getByRole('button', { name: 'has no owner' }));
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('owner:isEmpty:""');
    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Owner has no owner' }));
    body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole('button', { name: 'Confirm filter' })).toBeEnabled();
    await expect(ownerLoads.count).toBe(0);
    await userEvent.keyboard('{Escape}');

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Owner' }));
    await userEvent.click(body.getByRole('button', { name: 'is' }));
    await expect(await body.findByRole('button', { name: 'User One' })).toBeVisible();
    await expect(ownerLoads.count).toBe(1);
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={extraProperties}
      query={extraQuery}
      onquerychange={(next) => (extraQuery = next)}
    />
    <output data-testid="state">{rules(extraQuery)}</output>
  </div>
</Story>

<Story
  name="Editing an id-less repeated rule after rehydration never appends"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const [first] = canvas.getAllByRole('button', { name: 'Edit filter: Note contains same' });
    await userEvent.click(first);
    window.dispatchEvent(new Event('m404-rehydrate'));
    const input = body.getByRole('textbox', { name: 'Note value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'changed');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'note:contains:"same"|note:contains:"same"',
    );
    await expect(canvas.getByTestId('emits')).toHaveTextContent('0');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={idlessQuery}
      onquerychange={(next) => {
        idlessEmits += 1;
        idlessQuery = next;
      }}
    />
    <output data-testid="state">{rules(idlessQuery)}</output>
    <output data-testid="emits">{idlessEmits}</output>
  </div>
</Story>

<Story
  name="Persistent search collapses on mobile and stays on desktop"
  asChild
  parameters={{ viewport: { defaultViewport: 'mobile1' } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
    await expect(canvas.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('searchbox')).not.toBeInTheDocument());
    await expect(canvas.getByRole('button', { name: 'Search' })).toHaveFocus();

    if (!(await setViewport(desktop))) return;
    const searchbox = await canvas.findByRole('searchbox', { name: 'Search' });
    await userEvent.click(searchbox);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  }}
>
  <DataViewToolbar
    {properties}
    query={extraQuery}
    searchMode="persistent"
    onquerychange={(next) => (extraQuery = next)}
  />
</Story>

<Story
  name="Text operand keeps the default trim without a normalizer"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Note value' }), '  foo  ');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent('note:"foo"');

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Note' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    const input = body.getByRole('textbox', { name: 'Note value' });
    await userEvent.type(input, '   ');
    await expect(body.getByRole('button', { name: 'Confirm filter' })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, feff);
    await expect(input).toHaveValue(feff);
    await expect(body.getByRole('button', { name: 'Confirm filter' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByTestId('exact')).toHaveTextContent('note:"foo"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={defaultTrimQuery}
      onquerychange={(next) => (defaultTrimQuery = next)}
    />
    <output data-testid="exact">{exact(defaultTrimQuery)}</output>
  </div>
</Story>

<Story
  name="Identity normalizer keeps FEFF operands exactly"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Code' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Code value' }), feff);
    await expect(body.getByRole('button', { name: 'Confirm filter' })).toBeEnabled();
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent('code:"\\ufeff"');

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Code' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Code value' }), `${feff}a${feff}`);
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent(
      'code:"\\ufeff"|code:"\\ufeffa\\ufeff"',
    );
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );

    const chips = canvas.getAllByRole('button', { name: /^Edit filter: Code contains/ });
    await userEvent.click(chips[1]);
    const input = body.getByRole('textbox', { name: 'Code value' });
    await expect(input).toHaveValue(`${feff}a${feff}`);
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent(
      'code:"\\ufeff"|code:"\\ufeffa\\ufeff"',
    );
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={normalizedProperties(keepText)}
      query={keepQuery}
      onquerychange={(next) => (keepQuery = next)}
    />
    <output data-testid="exact">{exact(keepQuery)}</output>
  </div>
</Story>

<Story
  name="Custom normalizer disables blank text and commits its result"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Code' }));
    await userEvent.click(body.getByRole('button', { name: 'contains' }));
    const input = body.getByRole('textbox', { name: 'Code value' });
    await userEvent.click(input);
    await userEvent.paste(' \t\x1f ');
    await expect(input).toHaveValue(' \t\x1f ');
    await expect(body.getByRole('button', { name: 'Confirm filter' })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.paste(` ${feff}x\t`);
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent('code:"\\ufeffx"');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={normalizedProperties(stripAsciiEdges)}
      query={stripQuery}
      onquerychange={(next) => (stripQuery = next)}
    />
    <output data-testid="exact">{exact(stripQuery)}</output>
  </div>
</Story>

<Story
  name="Custom editor single text uses the normalizer; between keeps trim"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Pattern' }));
    await userEvent.click(body.getByRole('button', { name: 'matches' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Pattern value' }), feff);
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent('pattern:"\\ufeff"');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );

    await userEvent.click(canvas.getByRole('button', { name: /^Edit filter: Pattern matches/ }));
    await expect(body.getByRole('textbox', { name: 'Pattern value' })).toHaveValue(feff);
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );

    body = await openFilter(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Pattern' }));
    await userEvent.click(body.getByRole('button', { name: 'between' }));
    await userEvent.type(body.getByRole('textbox', { name: 'Pattern value' }), ' a ');
    await userEvent.type(body.getByRole('textbox', { name: 'Pattern end' }), ' b ');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('exact')).toHaveTextContent('pattern:["a","b"]');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={normalizedProperties(keepText)}
      query={patternQuery}
      filterEditors={{ pattern: patternEditor }}
      onquerychange={(next) => (patternQuery = next)}
    />
    <output data-testid="exact">{exact(patternQuery)}</output>
  </div>
</Story>

<Story
  name="Editing a non-repeat rule keeps its app id"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit filter: Title contains foo' }));
    const input = body.getByRole('textbox', { name: 'Title value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'bar');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    await expect(canvas.getByTestId('state')).toHaveTextContent('title:contains:"bar"');
    await expect(canvas.getByTestId('ids')).toHaveTextContent('app-7');
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={singleRuleProperties}
      query={appIdQuery}
      onquerychange={(next) => (appIdQuery = next)}
    />
    <output data-testid="state">{rules(appIdQuery)}</output>
    <output data-testid="ids">{ids(appIdQuery)}</output>
  </div>
</Story>

<Story
  name="Editing the first id-less non-repeat rule keeps its chip and focus"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const chip = canvas.getByRole('button', { name: 'Edit filter: Title contains a' });
    await userEvent.click(chip);
    const input = body.getByRole('textbox', { name: 'Title value' });
    await userEvent.clear(input);
    await userEvent.type(input, 'x');
    await userEvent.click(body.getByRole('button', { name: 'Confirm filter' }));
    // Legacy replace-and-append order is kept.
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'owner:contains:"b"|title:contains:"x"',
    );
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Confirm filter' })).not.toBeInTheDocument(),
    );
    await expect(chip.isConnected).toBe(true);
    await expect(chip).toHaveAccessibleName('Edit filter: Title contains x');
    await waitFor(() => expect(chip).toHaveFocus());
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={singleRuleProperties}
      query={legacyOrderQuery}
      onquerychange={(next) => (legacyOrderQuery = next)}
    />
    <output data-testid="state">{rules(legacyOrderQuery)}</output>
  </div>
</Story>
