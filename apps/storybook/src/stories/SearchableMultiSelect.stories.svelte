<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { SearchableMultiSelect, type SearchableMultiSelectOption } from '@platform/svelte-ui/searchable-multi-select';
  import { expect, userEvent, within } from 'storybook/test';
  const { Story } = defineMeta({ title: 'UI Library/Searchable Multi Select', component: SearchableMultiSelect, parameters: { layout: 'padded' } });
  const options: SearchableMultiSelectOption[] = [{ value: 'acme', label: 'Acme' }, { value: 'globex', label: 'Globex' }, { value: 'system', label: 'System source', locked: true }];
</script>
<script lang="ts">let value = $state(['system']);</script>
<Story name="Desktop selection and locked chips" asChild play={async ({ canvasElement }) => { const canvas = within(canvasElement); const body = within(canvasElement.ownerDocument.body); await expect(canvas.getByText('System source')).toBeVisible(); await userEvent.click(canvas.getByRole('button', { name: '選擇 Provider' })); await userEvent.click(body.getByRole('checkbox', { name: 'Acme' })); await expect(canvas.getByText('Acme')).toBeVisible(); await expect(canvas.queryByRole('button', { name: '移除 System source' })).not.toBeInTheDocument(); }}><div class="w-96"><SearchableMultiSelect label="Provider" bind:value {options} selectedOptions={options.filter((option) => value.includes(option.value))} /></div></Story>
<Story name="Mobile drawer" asChild parameters={{ viewport: { defaultViewport: 'mobile1' } }} play={async ({ canvasElement }) => { const canvas = within(canvasElement); const body = within(canvasElement.ownerDocument.body); await userEvent.click(canvas.getByRole('button', { name: '選擇 Provider' })); await expect(body.getByRole('dialog')).toHaveAttribute('data-vaul-drawer'); await expect(body.getByRole('checkbox', { name: 'Globex' })).toBeVisible(); }}><div class="w-full"><SearchableMultiSelect label="Provider" options={options} /></div></Story>
