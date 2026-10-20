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

  function expectInside(inner: Element, outer: DOMRect, what: string) {
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
