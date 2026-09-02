<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import type { IconProps } from "@lucide/svelte";

	let { class: className, ...restProps }: IconProps = $props();
</script>

<Loader2Icon
	role="status"
	aria-label="Loading"
	class={cn("size-4 animate-spin", className)}
	{...restProps}
/>
