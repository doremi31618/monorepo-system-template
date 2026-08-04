<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '@platform/ui/sonner';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<ModeWatcher />
<Toaster />
{@render children?.()}
