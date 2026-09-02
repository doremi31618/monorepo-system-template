<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Accordion from '@platform/svelte-ui/accordion';
  import * as AlertDialog from '@platform/svelte-ui/alert-dialog';
  import { Badge } from '@platform/svelte-ui/badge';
  import * as Breadcrumb from '@platform/svelte-ui/breadcrumb';
  import { Button } from '@platform/svelte-ui/button';
  import * as Card from '@platform/svelte-ui/card';
  import * as DropdownMenu from '@platform/svelte-ui/dropdown-menu';
  import * as Field from '@platform/svelte-ui/field';
  import { Input } from '@platform/svelte-ui/input';
  import * as InputOTP from '@platform/svelte-ui/input-otp';
  import { Label } from '@platform/svelte-ui/label';
  import * as NavigationMenu from '@platform/svelte-ui/navigation-menu';
  import * as Select from '@platform/svelte-ui/select';
  import { Separator } from '@platform/svelte-ui/separator';
  import * as Sheet from '@platform/svelte-ui/sheet';
  import * as Sidebar from '@platform/svelte-ui/sidebar';
  import { Skeleton } from '@platform/svelte-ui/skeleton';
  import { Toaster } from '@platform/svelte-ui/sonner';
  import { Spinner } from '@platform/svelte-ui/spinner';
  import { Textarea } from '@platform/svelte-ui/textarea';
  import * as Tooltip from '@platform/svelte-ui/tooltip';
  import { expect, userEvent, within } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI Library/All Components',
    parameters: {
      layout: 'centered',
    },
  });
</script>

<script lang="ts">
  let sidebarOpen = $state(true);
</script>

<Story name="Accordion" asChild>
  <Accordion.Root type="single" collapsible class="w-[420px]">
    <Accordion.Item value="architecture">
      <Accordion.Trigger>Where does this component live?</Accordion.Trigger>
      <Accordion.Content>
        UI primitives are owned by the shared Svelte UI package.
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
</Story>

<Story name="Alert Dialog" asChild>
  <AlertDialog.Root>
    <AlertDialog.Trigger>
      {#snippet child({ props })}
        <Button variant="destructive" {...props}>Delete item</Button>
      {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
        <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action>Continue</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</Story>

<Story name="Badge" asChild>
  <div class="flex gap-2">
    <Badge>Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
</Story>

<Story name="Breadcrumb" asChild>
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item><Breadcrumb.Link href="#home">Home</Breadcrumb.Link></Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item
        ><Breadcrumb.Link href="#components">Components</Breadcrumb.Link></Breadcrumb.Item
      >
      <Breadcrumb.Separator />
      <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</Story>

<Story name="Button" asChild>
  <div class="flex flex-wrap gap-2">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="link">Link</Button>
  </div>
</Story>

<Story name="Card" asChild>
  <Card.Root class="w-[380px]">
    <Card.Header>
      <Card.Title>Shared UI package</Card.Title>
      <Card.Description>A composable card built from public primitives.</Card.Description>
    </Card.Header>
    <Card.Content>Use the package from any Svelte application in the workspace.</Card.Content>
    <Card.Footer><Button size="sm">Continue</Button></Card.Footer>
  </Card.Root>
</Story>

<Story name="Dropdown Menu" asChild>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>Open menu</Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Label>Workspace</DropdownMenu.Label>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Profile</DropdownMenu.Item>
      <DropdownMenu.Item>Settings</DropdownMenu.Item>
      <DropdownMenu.Item>Sign out</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</Story>

<Story name="Field" asChild>
  <Field.Group class="w-[380px]">
    <Field.Field>
      <Field.Label for="storybook-email">Email</Field.Label>
      <Input id="storybook-email" type="email" placeholder="name@example.com" />
      <Field.Description>We only use this address for account notifications.</Field.Description>
    </Field.Field>
  </Field.Group>
</Story>

<Story name="Input" asChild>
  <Input class="w-[320px]" placeholder="Search components…" />
</Story>

<Story name="Input OTP" asChild>
  <InputOTP.Root maxlength={6} aria-label="One-time password">
    {#snippet children({ cells })}
      <InputOTP.Group>
        {#each cells as cell (cell)}
          <InputOTP.Slot {cell} />
        {/each}
      </InputOTP.Group>
    {/snippet}
  </InputOTP.Root>
</Story>

<Story name="Label" asChild>
  <div class="grid w-[320px] gap-2">
    <Label for="storybook-name">Display name</Label>
    <Input id="storybook-name" value="Platform user" />
  </div>
</Story>

<Story name="Navigation Menu" asChild>
  <NavigationMenu.Root>
    <NavigationMenu.List>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="#overview">Overview</NavigationMenu.Link>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <div class="grid w-[360px] gap-2 p-4">
            <NavigationMenu.Link href="#docs">Documentation</NavigationMenu.Link>
            <NavigationMenu.Link href="#examples">Examples</NavigationMenu.Link>
          </div>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  </NavigationMenu.Root>
</Story>

<Story name="Select" asChild>
  <Select.Root>
    <Select.Trigger class="w-[240px]">Choose a runtime</Select.Trigger>
    <Select.Content>
      <Select.Item value="browser">Browser</Select.Item>
      <Select.Item value="node">Node.js</Select.Item>
      <Select.Item value="shared">Shared</Select.Item>
    </Select.Content>
  </Select.Root>
</Story>

<Story name="Separator" asChild>
  <div class="w-[360px] space-y-3">
    <div>
      <div class="font-medium">Platform UI</div>
      <div class="text-sm text-muted-foreground">Reusable Svelte primitives</div>
    </div>
    <Separator />
    <div class="flex h-5 items-center gap-3 text-sm">
      <span>Docs</span><Separator orientation="vertical" /><span>Components</span>
    </div>
  </div>
</Story>

<Story name="Sheet" asChild>
  <Sheet.Root>
    <Sheet.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>Open sheet</Button>
      {/snippet}
    </Sheet.Trigger>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>Edit profile</Sheet.Title>
        <Sheet.Description>Update the profile information shown to your team.</Sheet.Description>
      </Sheet.Header>
      <div class="grid gap-4 py-6">
        <Label for="sheet-name">Name</Label>
        <Input id="sheet-name" value="Platform user" />
      </div>
      <Sheet.Footer><Sheet.Close>Save changes</Sheet.Close></Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
</Story>

<Story
  name="Sidebar"
  asChild
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resizeHandle = canvas.getByRole('separator', { name: 'Resize sidebar' });

    await expect(resizeHandle).toHaveAttribute('aria-valuemin', '240');
    await expect(resizeHandle).toHaveAttribute('aria-valuemax', '480');
    resizeHandle.focus();
    await userEvent.keyboard('{Home}{ArrowLeft}');
    await expect(resizeHandle).toHaveAttribute('aria-valuenow', '240');
    await userEvent.keyboard('{End}{ArrowRight}');
    await expect(resizeHandle).toHaveAttribute('aria-valuenow', '480');
    await userEvent.keyboard('{Home}{ArrowRight}');
    await expect(resizeHandle).toHaveAttribute('aria-valuenow', '248');

    await userEvent.pointer([
      { target: resizeHandle, coords: { clientX: 248 }, keys: '[MouseLeft>]' },
      { coords: { clientX: 328 } },
      { keys: '[/MouseLeft]' },
    ]);
    await expect(resizeHandle).toHaveAttribute('aria-valuenow', '328');
    await expect(localStorage.getItem('storybook:sidebar-width')).toBe('328');

    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(canvas.getByText('Overview')).not.toBeVisible();
    const expandButton = canvas.getByRole('button', { name: 'Expand sidebar' });
    await expect(expandButton).toBeVisible();
    await userEvent.click(expandButton);
    await expect(canvas.getByRole('separator', { name: 'Resize sidebar' })).toHaveAttribute(
      'aria-valuenow',
      '328',
    );
  }}
>
  <div class="h-[440px] w-[720px] overflow-hidden rounded-lg border">
    <Sidebar.Provider
      bind:open={sidebarOpen}
      storageKey="storybook:sidebar-width"
      style="min-height: 440px;"
    >
      <Sidebar.Root collapsible="offcanvas" class="h-[440px]">
        <Sidebar.Header class="flex-row items-center justify-between font-semibold">
          <span>Platform</span>
          <Sidebar.Trigger aria-label="Collapse sidebar" />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem
                  ><Sidebar.MenuButton isActive>Overview</Sidebar.MenuButton></Sidebar.MenuItem
                >
                <Sidebar.MenuItem
                  ><Sidebar.MenuButton>Components</Sidebar.MenuButton></Sidebar.MenuItem
                >
                <Sidebar.MenuItem
                  ><Sidebar.MenuButton>Settings</Sidebar.MenuButton></Sidebar.MenuItem
                >
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>v0.1.0</Sidebar.Footer>
        <Sidebar.Rail />
      </Sidebar.Root>
      <Sidebar.Inset class="p-6">
        {#if !sidebarOpen}
          <Sidebar.Trigger aria-label="Expand sidebar" />
        {/if}
        <h2 class="text-lg font-semibold">Sidebar content</h2>
        <p class="text-sm text-muted-foreground">The inset area renders beside the navigation.</p>
      </Sidebar.Inset>
    </Sidebar.Provider>
  </div>
</Story>

<Story name="Skeleton" asChild>
  <div class="flex w-[320px] items-center gap-4">
    <Skeleton class="size-12 rounded-full" />
    <div class="flex-1 space-y-2">
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
    </div>
  </div>
</Story>

<Story name="Sonner" asChild>
  <div class="w-[360px] rounded-lg border p-4">
    <Toaster />
    <p class="font-medium">Toast provider</p>
    <p class="text-sm text-muted-foreground">Mount this once near the application root.</p>
  </div>
</Story>

<Story name="Spinner" asChild>
  <div class="flex items-center gap-3">
    <Spinner />
    <span class="text-sm">Loading…</span>
  </div>
</Story>

<Story name="Textarea" asChild>
  <Textarea class="w-[360px]" placeholder="Write a short description…" />
</Story>

<Story name="Tooltip" asChild>
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Hover or focus</Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>Shared UI tooltip</Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
</Story>
