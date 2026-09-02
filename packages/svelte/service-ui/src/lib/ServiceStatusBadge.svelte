<script lang="ts">
  import { presentServiceStatus } from './service-presenter.js';
  import type { ServiceStatus } from './service.types.js';

  let { status }: { status: ServiceStatus } = $props();
  let presentation = $derived(presentServiceStatus(status));
</script>

<span
  class="badge"
  class:positive={presentation.tone === 'positive'}
  class:warning={presentation.tone === 'warning'}
  class:negative={presentation.tone === 'negative'}
  data-status={status}
>
  <span class="indicator" aria-hidden="true"></span>
  {presentation.label}
</span>

<style>
  .badge {
    --status-color: #64748b;
    align-items: center;
    background: color-mix(in srgb, var(--status-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--status-color) 28%, transparent);
    border-radius: 999px;
    color: var(--status-color);
    display: inline-flex;
    font-size: 0.75rem;
    font-weight: 650;
    gap: 0.4rem;
    line-height: 1;
    padding: 0.4rem 0.6rem;
  }

  .positive {
    --status-color: #15803d;
  }
  .warning {
    --status-color: #b45309;
  }
  .negative {
    --status-color: #b91c1c;
  }

  .indicator {
    background: currentColor;
    border-radius: 50%;
    height: 0.45rem;
    width: 0.45rem;
  }
</style>
