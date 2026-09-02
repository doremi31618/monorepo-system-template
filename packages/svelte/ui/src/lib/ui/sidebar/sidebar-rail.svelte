<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { onDestroy } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SIDEBAR_WIDTH_STEP } from './constants.js';
	import { useSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

	const sidebar = useSidebar();
	let stopDragging = () => {};

	const getSide = () => ref?.closest<HTMLElement>('[data-side]')?.dataset.side ?? 'left';

	const handlePointerdown = (event: PointerEvent) => {
		if (event.button !== 0) return;

		event.preventDefault();
		stopDragging();
		const startX = event.clientX;
		const startWidth = sidebar.width;
		const direction = getSide() === 'left' ? 1 : -1;
		const previousCursor = document.body.style.cursor;
		const previousUserSelect = document.body.style.userSelect;

		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';

		const handlePointermove = (moveEvent: PointerEvent) => {
			sidebar.setWidth(startWidth + (moveEvent.clientX - startX) * direction);
		};

		stopDragging = () => {
			window.removeEventListener('pointermove', handlePointermove);
			window.removeEventListener('pointerup', stopDragging);
			window.removeEventListener('pointercancel', stopDragging);
			document.body.style.cursor = previousCursor;
			document.body.style.userSelect = previousUserSelect;
			stopDragging = () => {};
		};

		window.addEventListener('pointermove', handlePointermove);
		window.addEventListener('pointerup', stopDragging);
		window.addEventListener('pointercancel', stopDragging);
	};

	const handleKeydown = (event: KeyboardEvent) => {
		const direction = getSide() === 'left' ? 1 : -1;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				sidebar.setWidth(sidebar.width - SIDEBAR_WIDTH_STEP * direction);
				break;
			case 'ArrowRight':
				event.preventDefault();
				sidebar.setWidth(sidebar.width + SIDEBAR_WIDTH_STEP * direction);
				break;
			case 'Home':
				event.preventDefault();
				sidebar.setWidth(sidebar.minWidth);
				break;
			case 'End':
				event.preventDefault();
				sidebar.setWidth(sidebar.maxWidth);
				break;
		}
	};

	onDestroy(() => stopDragging());
</script>

<button
	bind:this={ref}
	data-sidebar="rail"
	data-slot="sidebar-rail"
	role="separator"
	aria-label="Resize sidebar"
	aria-orientation="vertical"
	aria-valuemin={sidebar.minWidth}
	aria-valuemax={sidebar.maxWidth}
	aria-valuenow={sidebar.width}
	tabIndex={0}
	type="button"
	onpointerdown={handlePointerdown}
	onkeydown={handleKeydown}
	title="Resize sidebar"
	class={cn(
		'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 cursor-col-resize touch-none transition-all ease-linear group-data-[side=left]:-end-4 group-data-[side=right]:start-0 after:absolute after:inset-y-0 after:start-[calc(1/2*100%-1px)] after:w-[2px] hover:after:bg-sidebar-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex',
		'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:start-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
		'[[data-side=left][data-collapsible=offcanvas]_&]:-end-2',
		'[[data-side=right][data-collapsible=offcanvas]_&]:-start-2',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</button>
