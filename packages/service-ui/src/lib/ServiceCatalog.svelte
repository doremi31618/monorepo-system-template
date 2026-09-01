<script lang="ts">
  import ServiceCard from './ServiceCard.svelte';
  import { sortServices } from './service-presenter.js';
  import type { ServiceSummary } from './service.types.js';

  let {
    services,
    heading = 'Services',
    emptyMessage = 'No services are available.',
    onselect,
  }: {
    services: readonly ServiceSummary[];
    heading?: string;
    emptyMessage?: string;
    onselect?: (service: ServiceSummary) => void;
  } = $props();

  let orderedServices = $derived(sortServices(services));
</script>

<section class="catalog" aria-labelledby="service-catalog-heading">
  <header>
    <div>
      <p class="eyebrow">Capability platform</p>
      <h2 id="service-catalog-heading">{heading}</h2>
    </div>
    <span class="count">{orderedServices.length} total</span>
  </header>

  {#if orderedServices.length > 0}
    <div class="grid">
      {#each orderedServices as service (service.id)}
        <ServiceCard {service} {onselect} />
      {/each}
    </div>
  {:else}
    <p class="empty">{emptyMessage}</p>
  {/if}
</section>

<style>
  .catalog {
    color: var(--service-catalog-foreground, #0f172a);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }
  header {
    align-items: end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .eyebrow {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    margin: 0 0 0.35rem;
    text-transform: uppercase;
  }
  h2 {
    font-size: 1.5rem;
    letter-spacing: -0.025em;
    margin: 0;
  }
  .count {
    color: #64748b;
    font-size: 0.8rem;
  }
  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  }
  .empty {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 1rem;
    color: #64748b;
    padding: 2rem;
    text-align: center;
  }
</style>
