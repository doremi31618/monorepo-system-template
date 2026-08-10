# @platform/service-ui

Domain-neutral Svelte components for presenting platform services and capabilities.
The library is framework-bound to Svelte 5 but does not depend on NestJS, Express,
SvelteKit routing, or a specific business domain.

```svelte
<script lang="ts">
  import { ServiceCatalog } from '@platform/service-ui';

  const services = [
    {
      id: 'task-runtime',
      name: 'Task runtime',
      status: 'healthy',
      capabilities: [{ id: 'retry', label: 'Retry' }],
    },
  ];
</script>

<ServiceCatalog {services} heading="Platform services" />
```

Stories live in `stories/` and are aggregated by `apps/storybook`. Presenter logic has
package-owned unit tests under `tests/`; browser rendering and accessibility checks run
through the Storybook Vitest project.
