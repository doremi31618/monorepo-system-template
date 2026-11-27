<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    NotionMoreMenu,
    NotionTable,
    emptyColumnPrefs,
    type ColumnPrefs,
    type NotionColumn,
  } from '@platform/svelte-ui/notion-table';
  import { DataViewToolbar, type DataViewQuery } from '@platform/svelte-ui/data-view-toolbar';
  import { Badge } from '@platform/svelte-ui/badge';
  import { Button } from '@platform/svelte-ui/button';
  import { Checkbox } from '@platform/svelte-ui/checkbox';
  import { expect, userEvent, within } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI Library/Notion Table',
    component: NotionTable,
    parameters: { layout: 'padded' },
  });

  type Row = { id: string; name: string; status: string; owner: string; updated: string };
  const rows: Row[] = [
    { id: 'r-1', name: 'Quarterly roadmap', status: 'Published', owner: 'Ada', updated: '2026-11-01' },
    { id: 'r-2', name: 'Onboarding checklist with a deliberately long title that must wrap', status: 'Draft', owner: 'Grace', updated: '2026-10-20' },
  ];
  const columns: NotionColumn[] = [
    { key: 'select', label: 'Select', utility: true },
    { key: 'name', label: 'Name', identity: true, mobile: 'title' },
    { key: 'status', label: 'Status', mobile: 'status' },
    { key: 'owner', label: 'Owner' },
    { key: 'updated', label: 'Updated', mobile: 'footer' },
    { key: 'actions', label: 'Actions', utility: true, trailing: true },
  ];
  const desktop = { width: 1024, height: 768 };
  const phones = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ];

  async function setViewport(size: { width: number; height: number }) {
    if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) return false;
    const { page } = await import('vitest/browser');
    await page.viewport(size.width, size.height);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return true;
  }

  const px = (value: string) => Number.parseFloat(value);
  const top = (element: Element | null) => element!.getBoundingClientRect().top;
  function expectNoPageOverflowX(doc: Document) {
    expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(doc.documentElement.clientWidth);
  }
  function card(canvasElement: HTMLElement, name: string) {
    return within(canvasElement).getByText(name).closest('tr')!;
  }
  const labelled = (row: HTMLElement, label: string) =>
    row.querySelector<HTMLElement>(`td[data-label="${label}"]`);
  const overlaps = (a: DOMRect, b: DOMRect) =>
    a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

  /** R7: a single leading selection sits beside the card title, never over it or outside the card. */
  async function expectSelectionBesideTitle(row: HTMLElement, name: string, width: number) {
    const target = within(row).getByTestId('select-target').getBoundingClientRect();
    const titleCell = within(row).getByText(name).closest('td')!;
    const titleBox = titleCell.getBoundingClientRect();
    const text = row.ownerDocument.createRange();
    text.selectNodeContents(within(row).getByText(name));
    const textStart = text.getClientRects()[0].left;
    const card = row.getBoundingClientRect();
    const border = px(getComputedStyle(row).borderLeftWidth);
    await expect(target.width).toBeGreaterThanOrEqual(44);
    await expect(target.height).toBeGreaterThanOrEqual(44);
    await expect(target.top < titleBox.bottom && target.bottom > titleBox.top, `selection beside title at ${width}px`).toBe(true);
    await expect(target.right, `selection ends before the title text at ${width}px`).toBeLessThanOrEqual(textStart + 0.5);
    await expect(target.left).toBeGreaterThanOrEqual(card.left + border - 0.5);
    await expect(target.top).toBeGreaterThanOrEqual(card.top + border - 0.5);
    await expect(target.right).toBeLessThanOrEqual(card.right - border + 0.5);
  }

  /** Fallback (several leading utilities, or no title column): the R6 stacked top row, nothing overlapping. */
  async function expectStackedLeading(row: HTMLElement, leadingCells: HTMLElement[], firstContent: HTMLElement) {
    const boxes = [...leadingCells, firstContent].map((cell) => cell.getBoundingClientRect());
    for (const cell of leadingCells) await expect(getComputedStyle(cell).position).toBe('static');
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) await expect(overlaps(boxes[a], boxes[b]), `cells ${a}/${b} overlap`).toBe(false);
    for (const cell of leadingCells.map((c) => c.getBoundingClientRect()))
      await expect(cell.bottom).toBeLessThanOrEqual(firstContent.getBoundingClientRect().top + 0.5);
    await expect(row.contains(firstContent)).toBe(true);
  }

  const twoLeadingColumns: NotionColumn[] = [{ key: 'pin', label: 'Pin', utility: true }, ...columns];
  const untitledColumns: NotionColumn[] = columns.map((column) =>
    column.key === 'name' ? { key: 'name', label: 'Name', identity: true } : column,
  );
</script>

<script lang="ts">
  let prefs = $state<ColumnPrefs>(emptyColumnPrefs());
  let query = $state<DataViewQuery>({ search: '', filters: [], sorts: [] });
  let selected = $state<string[]>([]);
  const toggle = (id: string, on: boolean) =>
    (selected = on ? [...selected, id] : selected.filter((item) => item !== id));
</script>

{#snippet moreMenu()}
  <NotionMoreMenu {columns} bind:prefs />
{/snippet}

{#snippet table(tablePrefs: ColumnPrefs, tableColumns: NotionColumn[])}
  <NotionTable columns={tableColumns} prefs={tablePrefs} {rows} rowKey={(row) => row.id} ariaLabel="Documents">
    {#snippet header(column)}
      {#if column.key === 'select'}
        <!-- The caller owns selection; the label wrapper is the 44px touch target, not the 16px box. -->
        <label class="flex size-11 cursor-pointer items-center justify-center md:-m-3.5" data-testid="select-all">
          <Checkbox
            aria-label="Select all"
            checked={selected.length === rows.length}
            onCheckedChange={(on) => (selected = on ? rows.map((row) => row.id) : [])}
          />
        </label>
      {:else}
        {column.label}
      {/if}
    {/snippet}
    {#snippet cell(column, row)}
      {#if column.key === 'select'}
        <label class="flex size-11 cursor-pointer items-center justify-center md:-m-3.5" data-testid="select-target">
          <Checkbox
            aria-label={`Select ${row.name}`}
            checked={selected.includes(row.id)}
            onCheckedChange={(on) => toggle(row.id, on)}
          />
        </label>
      {:else if column.key === 'pin'}
        <Button variant="ghost" size="sm" class="max-md:min-h-11" aria-label={`Pin ${row.name}`}>Pin</Button>
      {:else if column.key === 'status'}
        <Badge variant="secondary">{row.status}</Badge>
      {:else if column.key === 'actions'}
        <Button variant="ghost" size="sm" class="max-md:min-h-11">Open</Button>
      {:else}
        {row[column.key as 'name' | 'owner' | 'updated']}
      {/if}
    {/snippet}
    {#snippet footer(row)}
      <span data-testid="card-footer">Footer actions for {row.id}</span>
    {/snippet}
    {#snippet empty()}No documents{/snippet}
  </NotionTable>
{/snippet}

<Story
  name="Controlled columns and phone cards"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    if (await setViewport(desktop)) {
      // Built-in Tailwind sizes only: no consumer theme token is required for the 14px table text.
      await expect(getComputedStyle(labelled(card(canvasElement, 'Quarterly roadmap'), 'Owner')!).fontSize).toBe('14px');
    }
    await expect(canvas.getByRole('region', { name: 'Documents' })).toBeVisible();
    await expect(canvas.getByRole('columnheader', { name: 'Owner' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name: 'Display columns' }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={[{ key: 'name', label: 'Name', type: 'text', operators: ['is'], sortable: true }]}
      {query}
      searchMode="persistent"
      actions={moreMenu}
      onquerychange={(next) => (query = next)}
    />
    {@render table(prefs, columns)}
  </div>
</Story>

<Story
  name="Phone card order, type scale, touch targets and width"
  asChild
  play={async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    for (const phone of phones) {
      if (!(await setViewport(phone))) return;
      const row = card(canvasElement, 'Quarterly roadmap');
      const title = within(row).getByText('Quarterly roadmap').closest('td')!;
      const status = within(row).getByText('Published').closest('td')!;
      const actions = within(row).getByRole('button', { name: 'Open' }).closest('td')!;
      await expectSelectionBesideTitle(row, 'Quarterly roadmap', phone.width);
      await expectSelectionBesideTitle(card(canvasElement, rows[1].name), rows[1].name, phone.width);
      const order = [title, status, labelled(row, 'Owner'), labelled(row, 'Updated'), within(row).getByTestId('card-footer'), actions];
      for (let index = 1; index < order.length; index++)
        await expect(top(order[index]), `card part ${index} sits below part ${index - 1} at ${phone.width}px`).toBeGreaterThan(top(order[index - 1]));

      // Card spacing and type: 16px padding, 14px between fields, 12px captions under 14px values, 17px title.
      const rowStyle = getComputedStyle(row);
      await expect(rowStyle.paddingTop).toBe('16px');
      await expect(rowStyle.rowGap).toBe('14px');
      const owner = labelled(row, 'Owner')!;
      await expect(getComputedStyle(owner, '::before').content).toBe('"Owner"');
      await expect(getComputedStyle(owner, '::before').fontSize).toBe('12px');
      await expect(getComputedStyle(owner).fontSize).toBe('14px');
      await expect(getComputedStyle(title).fontSize).toBe('17px');
      await expect(getComputedStyle(title, '::before').display).toBe('none');
      const selectAllCaption = canvasElement.querySelector('[data-slot="notion-table-mobile-header"] span[aria-hidden="true"]')!;
      await expect(selectAllCaption).toHaveTextContent('Select');
      await expect(px(getComputedStyle(selectAllCaption).fontSize)).toBe(12);

      expectNoPageOverflowX(doc);
      for (const target of within(canvasElement).getAllByTestId('select-target')) {
        const box = target.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(44);
        await expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // The whole 44px label toggles the row, not just the 16px box.
    const target = within(card(canvasElement, 'Quarterly roadmap')).getByTestId('select-target');
    const box = target.getBoundingClientRect();
    await userEvent.pointer({ keys: '[MouseLeft]', target, coords: { clientX: box.left + 2, clientY: box.top + 2 } });
    await expect(within(canvasElement).getByRole('checkbox', { name: 'Select Quarterly roadmap' })).toHaveAttribute('aria-checked', 'true');
    await setViewport(desktop);
  }}
>
  {@render table(emptyColumnPrefs(), columns)}
</Story>

<Story
  name="Hidden footer column stays hidden on phone cards"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(phones[0]))) return;
    const row = card(canvasElement, 'Quarterly roadmap');
    await expect(labelled(row, 'Updated')).toBeNull();
    await expect(within(row).queryByText('2026-11-01')).not.toBeInTheDocument();
    await expect(labelled(row, 'Owner')).toBeVisible();
    // The footer snippet still renders and takes the divider, below the remaining fields.
    const footer = within(row).getByTestId('card-footer');
    await expect(top(footer)).toBeGreaterThan(top(labelled(row, 'Owner')));
    await expect(getComputedStyle(footer.closest('td')!).borderTopWidth).toBe('1px');
    expectNoPageOverflowX(canvasElement.ownerDocument);
    await setViewport(desktop);
  }}
>
  {@render table({ order: [], hidden: ['updated'] }, columns)}
</Story>

<Story
  name="Several leading utilities keep the stacked top row on phones"
  asChild
  play={async ({ canvasElement }) => {
    for (const phone of phones) {
      if (!(await setViewport(phone))) return;
      const row = card(canvasElement, 'Quarterly roadmap');
      const pin = within(row).getByRole('button', { name: 'Pin Quarterly roadmap' }).closest('td')!;
      const select = within(row).getByTestId('select-target').closest('td')!;
      await expectStackedLeading(row, [pin, select], within(row).getByText('Quarterly roadmap').closest('td')!);
      expectNoPageOverflowX(canvasElement.ownerDocument);
    }
    await setViewport(desktop);
  }}
>
  {@render table(emptyColumnPrefs(), twoLeadingColumns)}
</Story>

<Story
  name="Without a title column the selection keeps the stacked top row on phones"
  asChild
  play={async ({ canvasElement }) => {
    for (const phone of phones) {
      if (!(await setViewport(phone))) return;
      const row = card(canvasElement, 'Quarterly roadmap');
      const select = within(row).getByTestId('select-target').closest('td')!;
      await expectStackedLeading(row, [select], labelled(row, 'Name')!);
      expectNoPageOverflowX(canvasElement.ownerDocument);
    }
    await setViewport(desktop);
  }}
>
  {@render table(emptyColumnPrefs(), untitledColumns)}
</Story>
