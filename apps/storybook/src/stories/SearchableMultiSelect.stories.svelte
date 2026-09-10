<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    AutoLoadSentinel,
    SearchableMultiSelect,
    type SearchableMultiSelectOption,
  } from '@platform/svelte-ui/searchable-multi-select';
  import { expect, userEvent, waitFor, within } from 'storybook/test';
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
  let remoteRequests = $state<string[]>([]);
  let stalledRequests = $state(0);
  let sentinelRoot = $state<HTMLElement | null>(null);
  let sentinelCalls = $state(0);
  let sentinelError = $state('');

  function loadSentinelDemo(): Promise<void> {
    sentinelCalls += 1;
    if (sentinelCalls === 1) {
      sentinelError = 'The first page failed';
      return Promise.reject(new Error(sentinelError));
    }
    sentinelError = '';
    return Promise.resolve();
  }
  const remoteLoader = async ({
    search,
    cursor,
    signal,
  }: {
    search: string;
    cursor?: string;
    signal: AbortSignal;
  }) => {
    remoteRequests = [...remoteRequests, `${search || 'all'}:${cursor ?? '0'}`];
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
      label: search === 'acct-1' ? `Acme account ${index}` : `${search || 'all'} option ${index}`,
    }));
    const offset = Number(cursor ?? 0);
    return {
      items: source.slice(offset, offset + 10),
      nextCursor: offset + 10 < source.length ? String(offset + 10) : null,
    };
  };
  const stalledLoader = async ({ cursor }: { cursor?: string }) => {
    stalledRequests += 1;
    if (!cursor)
      return {
        items: [{ value: 'first', label: 'First page' }],
        nextCursor: 'stuck',
      };
    return {
      items: [{ value: 'stuck', label: 'Stuck page' }],
      nextCursor: stalledRequests === 2 ? 'stuck' : null,
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
    await userEvent.click(canvas.getByRole('button', { name: '選擇Provider' }));
    await userEvent.click(body.getByRole('checkbox', { name: 'Acme' }));
    await expect(canvas.getByText('Acme')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: '移除 System source' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
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
    const trigger = canvas.getByRole('button', { name: '選擇Provider' });
    await userEvent.click(trigger);
    await expect(body.getByRole('dialog')).toHaveAttribute('data-vaul-drawer');
    await expect(body.getByRole('checkbox', { name: 'Globex' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  }}><div class="w-full"><SearchableMultiSelect label="Provider" {options} /></div></Story
>
<Story
  name="Remote stale search, retained selection, and page retry"
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
    const results = body
      .getByRole('checkbox', { name: 'new option 0' })
      .closest<HTMLElement>('[aria-label="Remote results"]');
    if (!results) throw new Error('Remote results pane was not rendered');
    results.scrollTop = results.scrollHeight;
    results.dispatchEvent(new Event('scroll'));
    await expect(await body.findByRole('alert')).toHaveTextContent('Page two failed');
    await userEvent.click(body.getByRole('button', { name: '重試' }));
    await expect(await body.findByRole('checkbox', { name: 'new option 10' })).toBeVisible();
    await waitFor(() =>
      expect(remoteRequests.filter((request) => request === 'new:10')).toHaveLength(2),
    );
    await expect(canvas.getByText('new option 0')).toBeVisible();
    await userEvent.clear(input);
    await userEvent.type(input, 'acct-1');
    await expect(await body.findByRole('checkbox', { name: 'Acme account 0' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
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
<Story
  name="Remote pagination stops a repeated cursor and retries it manually"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '選擇 Stalled' }));
    const first = await body.findByRole('checkbox', { name: 'First page' });
    const results = first.closest<HTMLElement>('[aria-label="Stalled results"]');
    if (!results) throw new Error('Stalled results pane was not rendered');
    results.scrollTop = results.scrollHeight;
    results.dispatchEvent(new Event('scroll'));
    await expect(await body.findByRole('alert')).toHaveTextContent('無法載入更多Stalled');
    await waitFor(() => expect(stalledRequests).toBe(2));
    await userEvent.click(body.getByRole('button', { name: '重試' }));
    await expect(await body.findByRole('checkbox', { name: 'Stuck page' })).toBeVisible();
    await expect(body.queryByRole('alert')).not.toBeInTheDocument();
    await expect(stalledRequests).toBe(3);
    await userEvent.keyboard('{Escape}');
  }}
  ><div class="w-96">
    <SearchableMultiSelect
      label="Stalled"
      ariaLabel="選擇 Stalled"
      loadOptions={stalledLoader}
    />
  </div></Story
>
<Story
  name="Auto load waits offscreen and retries an error"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scroller = canvas.getByLabelText('Sentinel scroller');
    await expect(canvas.getByText('Requested 0 pages')).toBeVisible();
    scroller.scrollTop = scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll'));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The first page failed');
    await userEvent.click(canvas.getByRole('button', { name: '重試' }));
    await waitFor(() => expect(canvas.getByText('Requested 2 pages')).toBeVisible());
  }}
  ><div
    bind:this={sentinelRoot}
    class="h-32 overflow-y-auto rounded border p-2"
    aria-label="Sentinel scroller"
  >
    <div class="h-96">The sentinel begins outside this viewport.</div>
    <AutoLoadSentinel
      root={sentinelRoot}
      hasMore={sentinelCalls === 0}
      error={sentinelError}
      onloadmore={loadSentinelDemo}
      ariaLabel="Load more demo results"
    />
    <p>Requested {sentinelCalls} pages</p>
  </div></Story
>
