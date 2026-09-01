# Icons

**Always use the project's configured `iconLibrary` for imports.** Check the `iconLibrary` field in `components.json`: `lucide` → `@lucide/svelte`, `tabler` → `@tabler/icons-svelte`, etc. Never assume `@lucide/svelte`.

## Contents

1. Choose icon-only or icon + label
2. Make icon-only controls accessible
3. Use `data-icon` inside Button
4. Avoid sizing classes inside components
5. Pass icons as components

---

## Choose icon-only or icon + label

Use icon-only Buttons for familiar, repeated, low-ambiguity actions such as close, search, filter,
sort, refresh, copy, overflow, and expand/collapse.

Use icon + label for primary, domain-specific, destructive, expensive, authentication, or
server-state-changing actions. Do not hide labels such as `Queue synchronization`, `Delete
account`, or `Retry failed files` behind an unfamiliar icon.

Use `size="icon"`, `icon-sm`, or another supported icon size only for a true icon-only Button.

## Make icon-only controls accessible

Give every icon-only Button an accessible name and a Tooltip:

```svelte
<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" aria-label="Refresh">
				<RefreshCwIcon />
			</Button>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content>Refresh</Tooltip.Content>
</Tooltip.Root>
```

Do not rely on the SVG component name for accessibility. Keep the hit target and visible focus
state large enough even when the glyph is compact.

## Icons in Button use data-icon attribute

Add `data-icon="inline-start"` (prefix) or `data-icon="inline-end"` (suffix) to the icon. No sizing classes on the icon.

**Incorrect:**

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<Button>
	<SearchIcon class="mr-2 size-4" />
	Search
</Button>
```

**Correct:**

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
</script>

<Button>
	<SearchIcon data-icon="inline-start" />
	Search
</Button>

<Button>
	Next
	<ArrowRightIcon data-icon="inline-end" />
</Button>
```

---

## No sizing classes on icons inside components

Components handle icon sizing via CSS. Don't add `size-4`, `w-4 h-4`, or other sizing classes to icons inside `<Button>`, `DropdownMenu.Item`, `Alert.Root`, `Sidebar.*`, or other shadcn-svelte components — unless the user explicitly asks for custom icon sizes.

**Incorrect:**

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<Button>
	<SearchIcon class="size-4" data-icon="inline-start" />
	Search
</Button>
```

**Correct:**

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<Button>
	<SearchIcon data-icon="inline-start" />
	Search
</Button>
```

The same applies to icons inside `DropdownMenu.Item`, sidebar items, and other menu rows — no extra sizing classes on the icon component.

---

## Pass icons as components, not string keys

Use a component reference, not a string key to a lookup map.

**Incorrect:**

```svelte
<!-- String key lookup — avoid -->
<DynamicIcon name="check" />
```

**Correct:**

```svelte
<script lang="ts">
	import type { Component } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';

	let { Icon }: { Icon: Component } = $props();
</script>

<Icon />

<!-- <StatusBadge Icon={CheckIcon} /> -->
```
