<script lang="ts">
  import ServiceStatusBadge from './ServiceStatusBadge.svelte';
  import type { ServiceSummary } from './service.types.js';

  let {
    service,
    onselect,
  }: {
    service: ServiceSummary;
    onselect?: (service: ServiceSummary) => void;
  } = $props();
</script>

<article class="service-card" data-service-id={service.id}>
  <header>
    <div class="identity">
      {#if onselect}
        <button type="button" onclick={() => onselect?.(service)}
          >{service.name}</button
        >
      {:else}
        <h3>{service.name}</h3>
      {/if}
      {#if service.version}<span class="version">v{service.version}</span>{/if}
    </div>
    <ServiceStatusBadge status={service.status} />
  </header>

  {#if service.description}
    <p class="description">{service.description}</p>
  {/if}

  <div class="capabilities" aria-label={`${service.name} capabilities`}>
    {#each service.capabilities as capability (capability.id)}
      <span title={capability.description}>{capability.label}</span>
    {:else}
      <span class="empty">No capabilities declared</span>
    {/each}
  </div>
</article>

<style>
  .service-card {
    background: var(--service-card-background, #fff);
    border: 1px solid var(--service-card-border, #e2e8f0);
    border-radius: 1rem;
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
    color: var(--service-card-foreground, #0f172a);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 10rem;
    padding: 1.25rem;
  }

  header,
  .identity,
  .capabilities {
    align-items: center;
    display: flex;
  }

  header {
    justify-content: space-between;
    gap: 1rem;
  }

  .identity {
    gap: 0.5rem;
    min-width: 0;
  }

  h3,
  button {
    color: inherit;
    font: inherit;
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }

  button {
    background: none;
    border: 0;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  button:hover {
    text-decoration: underline;
  }
  button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
  }

  .version,
  .description,
  .empty {
    color: #64748b;
  }
  .version {
    font-size: 0.75rem;
  }
  .description {
    font-size: 0.875rem;
    line-height: 1.55;
    margin: 0;
  }

  .capabilities {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
  }
  .capabilities > span {
    background: #f1f5f9;
    border-radius: 0.45rem;
    font-size: 0.75rem;
    padding: 0.35rem 0.5rem;
  }
  .capabilities > .empty {
    background: transparent;
    padding-left: 0;
  }
</style>
