<script lang="ts">
  import { onMount } from 'svelte';

  let {
    onloadmore,
    hasMore,
    loading = false,
    disabled = false,
    error = '',
    ariaLabel = 'Load more results',
    root,
  }: {
    onloadmore: () => void | Promise<void>;
    hasMore: boolean;
    loading?: boolean;
    disabled?: boolean;
    error?: string;
    ariaLabel?: string;
    root?: HTMLElement | null;
  } = $props();

  let element = $state<HTMLElement | null>(null);
  let observer: IntersectionObserver | undefined;
  let locked = false;

  function canLoad() {
    return hasMore && !loading && !disabled && !error && !locked;
  }
  function requestLoad() {
    if (!canLoad()) return;
    locked = true;
    Promise.resolve(onloadmore()).finally(() => { locked = false; });
  }
  function observe() {
    observer?.disconnect();
    if (!element || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) requestLoad();
    }, { root: root ?? null, rootMargin: '96px' });
    observer.observe(element);
  }
  onMount(() => {
    observe();
    return () => observer?.disconnect();
  });
  $effect(() => {
    root;
    element;
    observe();
  });
  $effect(() => {
    // Re-arm after a page completes. This covers short scrollers whose sentinel never leaves view.
    if (!loading && hasMore && !disabled && !error) queueMicrotask(requestLoad);
  });
</script>

<div bind:this={element} role="status" aria-label={ariaLabel} class="grid min-h-9 place-items-center py-2 text-xs text-muted-foreground">
  {#if loading}載入中…{:else if error}<span role="alert">{error}</span>{:else if !hasMore}已載入全部項目{/if}
</div>
