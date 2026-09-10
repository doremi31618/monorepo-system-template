<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    SearchableMultiSelect,
    type SearchableMultiSelectOption,
  } from '@platform/svelte-ui/searchable-multi-select';
  import { expect, userEvent, within } from 'storybook/test';
  const { Story } = defineMeta({
    title: 'UI Library/Searchable Multi Select',
    component: SearchableMultiSelect,
    parameters: { layout: 'padded' },
  });
  const options: SearchableMultiSelectOption[] = [
    { value: 'acme', label: 'Acme' },
    { value: 'globex', label: 'Globex' },
    { value: 'system', label: 'System source', locked: true },
  ];
</script>

<script lang="ts">
  let value = $state(['system']);
  let remoteValue = $state<string[]>([]);
  let failedPageTwo = $state(false);
  const remoteLoader = async ({
    search,
    cursor,
    signal,
  }: {
    search: string;
    cursor?: string;
    signal: AbortSignal;
  }) => {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, search === 'old' ? 80 : 10);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
    if (cursor === '10' && !failedPageTwo) {
      failedPageTwo = true;
      throw new Error('Page two failed');
    }
    const source = Array.from({ length: 30 }, (_, index) => ({
      value: `remote-${index}`,
      label: `${search || 'all'} option ${index}`,
    }));
    const offset = Number(cursor ?? 0);
    return {
      items: source.slice(offset, offset + 10),
      nextCursor: offset + 10 < source.length ? String(offset + 10) : null,
    };
  };
</script>

<Story
  name="Desktop selection and locked chips"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText('System source')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '選擇 Provider' }));
    await userEvent.click(body.getByRole('checkbox', { name: 'Acme' }));
    await expect(canvas.getByText('Acme')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: '移除 System source' }),
    ).not.toBeInTheDocument();
  }}
  ><div class="w-96">
    <SearchableMultiSelect
      label="Provider"
      bind:value
      {options}
      selectedOptions={options.filter((option) => value.includes(option.value))}
    />
  </div></Story
>
<Story
  name="Mobile drawer"
  asChild
  parameters={{ viewport: { defaultViewport: 'mobile1' } }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '選擇 Provider' }));
    await expect(body.getByRole('dialog')).toHaveAttribute('data-vaul-drawer');
    await expect(body.getByRole('checkbox', { name: 'Globex' })).toBeVisible();
  }}><div class="w-full"><SearchableMultiSelect label="Provider" {options} /></div></Story
>
<Story
  name="Remote stale search and retry"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '選擇 Remote' }));
    const input = body.getByRole('searchbox', { name: '搜尋Remote' });
    await userEvent.type(input, 'old');
    await userEvent.clear(input);
    await userEvent.type(input, 'new');
    await expect(await body.findByRole('checkbox', { name: 'new option 0' })).toBeVisible();
    await expect(body.queryByRole('checkbox', { name: 'old option 0' })).not.toBeInTheDocument();
    await userEvent.click(body.getByRole('checkbox', { name: 'new option 0' }));
    await expect(canvas.getByText('new option 0')).toBeVisible();
  }}
  ><div class="w-96">
    <SearchableMultiSelect
      label="Remote"
      ariaLabel="選擇 Remote"
      bind:value={remoteValue}
      loadOptions={remoteLoader}
    />
  </div></Story
>
