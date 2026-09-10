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
  let intersecting = $state(false);
  let locked = false;
  function requestLoad(retry = false) {
    if (
      (!retry && !intersecting) ||
      (!retry && !hasMore) ||
      loading ||
      disabled ||
      locked ||
      (!retry && error)
    )
      return;
    locked = true;
    Promise.resolve()
      .then(() => onloadmore())
      // The owner exposes a failed request through `error`; this prevents a rejected
      // callback from leaking an unhandled promise while the sentinel is re-armed.
      .catch(() => undefined)
      .finally(() => {
        locked = false;
      });
  }
  function observe() {
    observer?.disconnect();
    if (!element || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver(
      (entries) => {
        intersecting = entries.some((entry) => entry.isIntersecting);
      },
      { root: root ?? null, rootMargin: '96px' },
    );
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
    if (intersecting && !loading && hasMore && !disabled && !error)
      queueMicrotask(() => requestLoad());
  });
</script>

<div
  bind:this={element}
  role="status"
  aria-label={ariaLabel}
  class="grid min-h-9 place-items-center py-2 text-xs text-muted-foreground"
>
  {#if loading}載入中…{:else if error}<div class="flex items-center gap-2">
      <span role="alert">{error}</span><button
        type="button"
        class="underline"
        onclick={() => requestLoad(true)}>重試</button
      >
    </div>{:else if !hasMore}已載入全部項目{/if}
</div>
