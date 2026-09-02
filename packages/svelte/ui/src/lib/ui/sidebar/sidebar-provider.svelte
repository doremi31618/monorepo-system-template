<script lang="ts">
	import * as Tooltip from '$lib/ui/tooltip/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
		SIDEBAR_WIDTH_MAX,
		SIDEBAR_WIDTH_MIN,
		SIDEBAR_WIDTH_STORAGE_KEY
	} from './constants.js';
	import { setSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		open = $bindable(true),
		onOpenChange = () => {},
		openMobile = $bindable(false),
		onOpenMobileChange = () => {},
		width = $bindable(SIDEBAR_WIDTH),
		minWidth = SIDEBAR_WIDTH_MIN,
		maxWidth = SIDEBAR_WIDTH_MAX,
		storageKey = SIDEBAR_WIDTH_STORAGE_KEY,
		onWidthChange = () => {},
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		openMobile?: boolean;
		onOpenMobileChange?: (open: boolean) => void;
		width?: number;
		minWidth?: number;
		maxWidth?: number;
		storageKey?: string;
		onWidthChange?: (width: number) => void;
	} = $props();

	const setWidth = (value: number) => {
		const nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(value)));
		width = nextWidth;
		onWidthChange(nextWidth);
		localStorage.setItem(storageKey, String(nextWidth));
	};

	const sidebar = setSidebar({
		open: () => open,
		openMobile: () => openMobile,
		setOpen: (value: boolean) => {
			open = value;
			onOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
		setOpenMobile: (value: boolean) => {
			openMobile = value;
			onOpenMobileChange(value);
		},
		width: () => width,
		minWidth: () => minWidth,
		maxWidth: () => maxWidth,
		setWidth
	});

	onMount(() => {
		const savedWidth = Number(localStorage.getItem(storageKey));
		if (Number.isFinite(savedWidth) && savedWidth > 0) {
			setWidth(savedWidth);
		}
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {width}px; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
