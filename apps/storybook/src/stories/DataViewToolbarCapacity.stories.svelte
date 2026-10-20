<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    DataViewToolbar,
    type DataViewProperty,
    type DataViewQuery,
  } from '@platform/svelte-ui/data-view-toolbar';
  import { expect, userEvent, waitFor, within } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI Library/Data View Toolbar/Property capacity',
    component: DataViewToolbar,
    parameters: { layout: 'padded' },
  });

  // Capacity under test: 4 built-in fields plus 50 custom fields with
  // 100-character labels, i.e. 54 property buttons in the picker.
  const fieldLabel = (index: number) =>
    `Custom field ${String(index).padStart(2, '0')} ${'with a very long descriptive name '.repeat(4)}`.slice(0, 100);
  const lastLabel = fieldLabel(50);
  const builtIns: DataViewProperty[] = [
    { key: 'name', label: 'Name', type: 'text', operators: ['contains'] },
    {
      key: 'status',
      label: 'Status',
      type: 'enum',
      operators: ['is'],
      options: [{ value: 'open', label: 'Open' }],
    },
    { key: 'created', label: 'Created', type: 'date', operators: ['is'] },
    { key: 'updated', label: 'Updated', type: 'date', operators: ['is'] },
  ];
  const customFields: DataViewProperty[] = Array.from({ length: 50 }, (_, offset) => ({
    key: `field_${offset + 1}`,
    label: fieldLabel(offset + 1),
    type: 'text',
    operators: ['contains'],
    allowRepeat: true,
    operatorMeta: { contains: { operand: 'single' } },
    // Consumer-style normalizer: collapses edge spaces only.
    normalizeText: (raw: string) => raw.replace(/^ +| +$/g, ''),
  }));
  const properties = [...builtIns, ...customFields];
  const empty = (): DataViewQuery => ({ search: '', filters: [], sorts: [] });
  const desktop = { width: 1024, height: 768 };
  const portrait = { width: 375, height: 667 };
  const landscape = { width: 667, height: 375 };
  const tallPortrait = { width: 375, height: 812 };

  // Option capacity: a multi enum with 100 options whose labels are 100
  // characters each, in CJK (breaks anywhere) and unbroken Latin (no breaks).
  const cjkDigits = '〇一二三四五六七八九';
  const cjkLabel = (index: number) =>
    `選項${[...String(index).padStart(3, '0')].map((digit) => cjkDigits[Number(digit)]).join('')}${'資料檢視工具列篩選條件中非常冗長的中文選項名稱說明'.repeat(5)}`.slice(0, 100);
  const latinLabel = (index: number) =>
    `Option${String(index).padStart(3, '0')}${'Unbrokenlabelwithoutanyspaces'.repeat(4)}`.slice(0, 100);
  const optionProperty = (
    key: string,
    label: string,
    optionLabel: (index: number) => string,
  ): DataViewProperty => ({
    key,
    label,
    type: 'enum',
    operators: ['containsAny'],
    operatorMeta: { containsAny: { operand: 'multi', label: 'Contains any' } },
    options: Array.from({ length: 100 }, (_, offset) => ({
      value: `o${offset + 1}`,
      label: optionLabel(offset + 1),
    })),
  });
  const cjkProperty = optionProperty('cjk', '中文選項', cjkLabel);
  const latinProperty = optionProperty('latin', 'Latin options', latinLabel);
  const optionProperties = [cjkProperty, latinProperty];

  // Field-name capacity: 100-character field names flow through the picker,
  // the operator step header, the value step and the active-filter chip.
  const longField = (key: string, label: string): DataViewProperty => ({
    key,
    label,
    type: 'text',
    operators: ['contains', 'isEmpty'],
    operatorMeta: { isEmpty: { operand: 'none', label: 'is empty' } },
  });
  const cjkField = longField(
    'cjk_field',
    `自訂欄位${'資料檢視工具列篩選條件中非常冗長的中文欄位名稱說明'.repeat(5)}`.slice(0, 100),
  );
  const latinField = longField(
    'latin_field',
    `Customfield${'Unbrokenfieldnamewithoutanyspaces'.repeat(4)}`.slice(0, 100),
  );

  /** Resizes the test iframe under Vitest browser mode; a no-op elsewhere. */
  async function setViewport(size: { width: number; height: number }) {
    if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__)
      return false;
    const { page } = await import('vitest/browser');
    await page.viewport(size.width, size.height);
    return true;
  }

  /** The nearest ancestor (up to `stop`) that actually scrolls vertically. */
  function scrollContainer(element: Element, stop: Element) {
    for (let node = element.parentElement; node; node = node.parentElement) {
      const { overflowY } = getComputedStyle(node);
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
        return node;
      if (node === stop) return null;
    }
    return null;
  }

  function expectInside(inner: Element | Range, outer: DOMRect, what: string) {
    const rect = inner.getBoundingClientRect();
    const box = (r: DOMRect) => [r.top, r.right, r.bottom, r.left].map(Math.round).join(',');
    const fits =
      rect.top >= outer.top - 1 &&
      rect.left >= outer.left - 1 &&
      rect.bottom <= outer.bottom + 1 &&
      rect.right <= outer.right + 1;
    expect(fits, `${what}: ${box(rect)} not inside ${box(outer)}`).toBe(true);
  }

  function viewportRect(doc: Document) {
    const { clientWidth, clientHeight } = doc.documentElement;
    return new DOMRect(0, 0, clientWidth, clientHeight);
  }

  function expectNoPageOverflowX(doc: Document) {
    expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(doc.documentElement.clientWidth);
  }

  /** Tabs through the focus trap until the last property has keyboard focus. */
  async function tabTo(target: HTMLElement) {
    for (let presses = 0; presses < 80 && target.ownerDocument.activeElement !== target; presses++)
      await userEvent.tab();
    await expect(target).toHaveFocus();
  }

  async function waitForUnlock(doc: Document) {
    await waitFor(() => expect(doc.body.style.pointerEvents).not.toBe('none'), {
      timeout: 3000,
    });
  }

  /** Each item keeps its own text, stacks without overlap and stays within `container`'s width. */
  function expectStacked(items: HTMLElement[], container: HTMLElement, doc: Document) {
    const box = container.getBoundingClientRect();
    // Horizontal bounds only: containers may scroll vertically.
    const content = new DOMRect(box.left + container.clientLeft, -1e6, container.clientWidth, 2e6);
    let previous: DOMRect | undefined;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const name = item.textContent?.trim().slice(0, 8);
      if (name) {
        const range = doc.createRange();
        range.selectNodeContents(item);
        expectInside(range, rect, `text of ${name}`);
      }
      expectInside(item, content, `${name} within width`);
      if (previous)
        expect(rect.top, `${name} overlaps the item above`).toBeGreaterThanOrEqual(previous.bottom - 1);
      previous = rect;
    }
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  }

  /** Every rendered option keeps its own text, stacks without overlap and stays in the list. */
  function expectOptionsLaidOut(list: HTMLElement, doc: Document) {
    const options = [...list.querySelectorAll<HTMLElement>('button[aria-pressed]')];
    expectStacked(options, list, doc);
    return options;
  }

  /** The open editor step: its controls fit the overlay and the page never scrolls sideways. */
  function expectEditorFits(overlay: HTMLElement, doc: Document) {
    const editor = overlay.querySelector<HTMLElement>('[aria-label="Filter editor"]')!;
    const steps = [...editor.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement && !child.matches('.sticky'),
    );
    expectStacked(steps, editor, doc);
    expectInside(editor, overlay.getBoundingClientRect(), 'editor in overlay');
    expect(overlay.scrollWidth).toBeLessThanOrEqual(overlay.clientWidth);
    expectNoPageOverflowX(doc);
  }

  /** Walks a 100-character field name through picker, operator step, value step and chip. */
  async function addLongField(
    canvasElement: HTMLElement,
    overlaySelector: string,
    property: DataViewProperty,
  ) {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const body = within(doc.body);
    const overlay = () => doc.querySelector<HTMLElement>(overlaySelector);
    expect([...property.label]).toHaveLength(100);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    await waitFor(() => expect(overlay()).not.toBeNull());
    await waitFor(() => expectInside(overlay()!, viewportRect(doc), 'overlay'));
    expectEditorFits(overlay()!, doc);

    await userEvent.click(body.getByRole('button', { name: property.label }));
    // Operator step: the selected-field (back) button and every operator.
    const operator = await body.findByRole('button', { name: 'contains' });
    expectEditorFits(overlay()!, doc);
    expectInside(operator, viewportRect(doc), 'operator in viewport');

    await userEvent.click(operator);
    const input = body.getByRole('textbox', { name: `${property.label} value` });
    expectEditorFits(overlay()!, doc);
    await userEvent.type(input, 'abc');
    const confirm = body.getByRole('button', { name: 'Confirm filter' });
    for (const control of [input, body.getByRole('button', { name: 'Cancel' }), confirm])
      await waitFor(() => expectInside(control, viewportRect(doc), 'editor control'));
    await userEvent.click(confirm);
    await waitFor(() => expect(overlay()).toBeNull());
    await waitForUnlock(doc);

    // Chip: wraps inside its own button, its remove button stays on screen.
    const chip = canvas.getByRole('button', { name: `Edit filter: ${property.label} contains abc` });
    const chips = canvas.getByLabelText('Active filters');
    const range = doc.createRange();
    range.selectNodeContents(chip);
    expectInside(range, chip.getBoundingClientRect(), 'chip text');
    expectInside(chip, chips.getBoundingClientRect(), 'chip in active filters');
    expectInside(
      canvas.getByRole('button', { name: `Remove ${property.label} filter` }),
      viewportRect(doc),
      'chip remove button',
    );
    expect(chips.scrollWidth).toBeLessThanOrEqual(chips.clientWidth);
    expectNoPageOverflowX(doc);

    // Editing the chip opens straight at the value step header.
    await userEvent.click(chip);
    await waitFor(() => expect(overlay()).not.toBeNull());
    await body.findByRole('textbox', { name: `${property.label} value` });
    expectEditorFits(overlay()!, doc);
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(overlay()).toBeNull());
    await waitFor(() => expect(chip).toHaveFocus());
    await waitForUnlock(doc);
  }

  /** Opens the 100-option list in the drawer, Tabs to the 100th option and commits it. */
  async function selectLastOption(canvasElement: HTMLElement, property: DataViewProperty) {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const body = within(doc.body);
    const labels = property.options!.map((option) => option.label);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    const drawer = await waitFor(() => {
      const element = doc.querySelector('[data-vaul-drawer]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    await userEvent.click(body.getByRole('button', { name: property.label }));
    await userEvent.click(body.getByRole('button', { name: 'Contains any' }));
    const list = body.getByLabelText(`${property.label} options`);
    await waitFor(() => expectInside(drawer, viewportRect(doc), 'drawer'));
    await expect(body.getByRole('button', { name: labels[0] })).toBeVisible();
    expectOptionsLaidOut(list, doc);

    // Keyboard: Tab scrolls the list, which reveals options ten at a time.
    for (let presses = 0; presses < 160; presses++) {
      if (doc.activeElement?.textContent === labels[99]) break;
      await userEvent.tab();
      await new Promise(requestAnimationFrame);
    }
    const last = body.getByRole('button', { name: labels[99] });
    await expect(last).toHaveFocus();
    await waitFor(() => expectInside(last, list.getBoundingClientRect(), '100th option in list'));
    expectInside(last, viewportRect(doc), '100th option in viewport');
    await expect(expectOptionsLaidOut(list, doc)).toHaveLength(100);
    expect(drawer.scrollWidth).toBeLessThanOrEqual(drawer.clientWidth);
    expectNoPageOverflowX(doc);

    await userEvent.keyboard('{Enter}');
    await expect(last).toHaveAttribute('aria-pressed', 'true');
    // The footer stays reachable and is not covered by the options.
    const confirm = body.getByRole('button', { name: 'Confirm filter' });
    await waitFor(() => expectInside(confirm, drawer.getBoundingClientRect(), 'Confirm in drawer'));
    expectInside(confirm, viewportRect(doc), 'Confirm in viewport');
    const box = confirm.getBoundingClientRect();
    expect(confirm.contains(doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBe(true);
    await tabTo(confirm);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(doc.querySelector('[data-vaul-drawer]')).toBeNull());
    await waitForUnlock(doc);
  }

  /** Opens the picker, proves the 50th field is reachable, and commits a rule for it. */
  async function addLastField(
    canvasElement: HTMLElement,
    overlaySelector: string,
    value: string,
  ) {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const body = within(doc.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add filter' }));
    const overlay = await waitFor(() => {
      const element = doc.querySelector(overlaySelector);
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    const last = body.getByRole('button', { name: lastLabel });
    await expect(body.getAllByRole('button', { name: /^Custom field / })).toHaveLength(50);

    // The overlay itself stays inside the viewport (after open animations settle).
    await waitFor(() => expectInside(overlay, viewportRect(doc), 'overlay'));
    const container = scrollContainer(last, overlay);
    expect(container, 'property list has an inner scroll container').not.toBeNull();
    expectInside(container!, overlay.getBoundingClientRect(), 'scroll container');

    // Keyboard: focus scrolls the real container until the 50th field is visible.
    await tabTo(last);
    await waitFor(() => expectInside(last, container!.getBoundingClientRect(), 'last field'));
    expectInside(last, viewportRect(doc), 'last field in viewport');
    expect(container!.scrollTop).toBeGreaterThan(0);
    expect(overlay.scrollWidth).toBeLessThanOrEqual(overlay.clientWidth);
    expectNoPageOverflowX(doc);

    await userEvent.keyboard('{Enter}');
    await userEvent.click(await body.findByRole('button', { name: 'contains' }));
    const input = body.getByRole('textbox', { name: `${lastLabel} value` });
    await userEvent.type(input, value);
    const cancel = body.getByRole('button', { name: 'Cancel' });
    const confirm = body.getByRole('button', { name: 'Confirm filter' });
    for (const control of [input, cancel, confirm])
      await waitFor(() => expectInside(control, viewportRect(doc), 'editor control'));
    expectNoPageOverflowX(doc);
    await userEvent.click(confirm);
    await waitFor(() => expect(doc.querySelector(overlaySelector)).toBeNull());
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Add filter' })).toHaveFocus(),
    );
    await waitForUnlock(doc);
  }
</script>

<script lang="ts">
  let desktopQuery = $state<DataViewQuery>(empty());
  let portraitQuery = $state<DataViewQuery>(empty());
  let landscapeQuery = $state<DataViewQuery>(empty());
  let optionQueries = $state<DataViewQuery[]>([empty(), empty(), empty(), empty()]);
  let fieldQueries = $state<DataViewQuery[]>([empty(), empty(), empty(), empty(), empty(), empty()]);
  const rules = (value: DataViewQuery) =>
    value.filters
      .map((rule) => `${rule.property}:${rule.operator}:${JSON.stringify(rule.value)}`)
      .join('|') || 'empty';
</script>

<Story
  name="Desktop popover keeps the 50th custom field reachable"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(desktop))) return;
    const canvas = within(canvasElement);
    await addLastField(canvasElement, '[data-slot="popover-content"]', ' one ');
    await expect(canvas.getByTestId('state')).toHaveTextContent('field_50:contains:"one"');
    // Repeat stays enabled for the same field.
    await addLastField(canvasElement, '[data-slot="popover-content"]', 'two');
    await expect(canvas.getByTestId('state')).toHaveTextContent(
      'field_50:contains:"one"|field_50:contains:"two"',
    );
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={desktopQuery}
      onquerychange={(next) => (desktopQuery = next)}
    />
    <output data-testid="state">{rules(desktopQuery)}</output>
  </div>
</Story>

<Story
  name="Phone portrait drawer keeps the 50th custom field reachable"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(portrait))) return;
    const canvas = within(canvasElement);
    await addLastField(canvasElement, '[data-vaul-drawer]', ' one ');
    await expect(canvas.getByTestId('state')).toHaveTextContent('field_50:contains:"one"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={portraitQuery}
      onquerychange={(next) => (portraitQuery = next)}
    />
    <output data-testid="state">{rules(portraitQuery)}</output>
  </div>
</Story>

<Story
  name="Phone landscape drawer keeps the 50th custom field reachable"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(landscape))) return;
    const canvas = within(canvasElement);
    await addLastField(canvasElement, '[data-vaul-drawer]', ' one ');
    await expect(canvas.getByTestId('state')).toHaveTextContent('field_50:contains:"one"');
  }}
>
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      {properties}
      query={landscapeQuery}
      onquerychange={(next) => (landscapeQuery = next)}
    />
    <output data-testid="state">{rules(landscapeQuery)}</output>
  </div>
</Story>

{#snippet optionStory(index: number)}
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={optionProperties}
      query={optionQueries[index]}
      onquerychange={(next) => {
        optionQueries[index] = next;
      }}
    />
    <output data-testid="state">{rules(optionQueries[index])}</output>
  </div>
{/snippet}

<Story
  name="Phone portrait drawer lays out 100 long CJK options"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(tallPortrait))) return;
    await selectLastOption(canvasElement, cjkProperty);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('cjk:containsAny:["o100"]');
  }}
>
  {@render optionStory(0)}
</Story>

<Story
  name="Phone landscape drawer lays out 100 long CJK options"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(landscape))) return;
    await selectLastOption(canvasElement, cjkProperty);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('cjk:containsAny:["o100"]');
  }}
>
  {@render optionStory(1)}
</Story>

<Story
  name="Phone portrait drawer lays out 100 unbroken Latin options"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(tallPortrait))) return;
    await selectLastOption(canvasElement, latinProperty);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('latin:containsAny:["o100"]');
  }}
>
  {@render optionStory(2)}
</Story>

<Story
  name="Phone landscape drawer lays out 100 unbroken Latin options"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(landscape))) return;
    await selectLastOption(canvasElement, latinProperty);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('latin:containsAny:["o100"]');
  }}
>
  {@render optionStory(3)}
</Story>

{#snippet fieldStory(index: number, field: DataViewProperty)}
  <div class="flex w-full flex-col gap-4">
    <DataViewToolbar
      properties={[builtIns[0], field]}
      query={fieldQueries[index]}
      onquerychange={(next) => {
        fieldQueries[index] = next;
      }}
    />
    <output data-testid="state">{rules(fieldQueries[index])}</output>
  </div>
{/snippet}

<Story
  name="Phone landscape drawer fits a 100 character CJK field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(landscape))) return;
    await addLongField(canvasElement, '[data-vaul-drawer]', cjkField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('cjk_field:contains:"abc"');
  }}
>
  {@render fieldStory(0, cjkField)}
</Story>

<Story
  name="Phone portrait drawer fits a 100 character CJK field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(tallPortrait))) return;
    await addLongField(canvasElement, '[data-vaul-drawer]', cjkField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('cjk_field:contains:"abc"');
  }}
>
  {@render fieldStory(1, cjkField)}
</Story>

<Story
  name="Desktop popover fits a 100 character CJK field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(desktop))) return;
    await addLongField(canvasElement, '[data-slot="popover-content"]', cjkField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('cjk_field:contains:"abc"');
  }}
>
  {@render fieldStory(2, cjkField)}
</Story>

<Story
  name="Phone landscape drawer fits a 100 character unbroken Latin field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(landscape))) return;
    await addLongField(canvasElement, '[data-vaul-drawer]', latinField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('latin_field:contains:"abc"');
  }}
>
  {@render fieldStory(3, latinField)}
</Story>

<Story
  name="Phone portrait drawer fits a 100 character unbroken Latin field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(tallPortrait))) return;
    await addLongField(canvasElement, '[data-vaul-drawer]', latinField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('latin_field:contains:"abc"');
  }}
>
  {@render fieldStory(4, latinField)}
</Story>

<Story
  name="Desktop popover fits a 100 character unbroken Latin field name"
  asChild
  play={async ({ canvasElement }) => {
    if (!(await setViewport(desktop))) return;
    await addLongField(canvasElement, '[data-slot="popover-content"]', latinField);
    await expect(within(canvasElement).getByTestId('state')).toHaveTextContent('latin_field:contains:"abc"');
  }}
>
  {@render fieldStory(5, latinField)}
</Story>
