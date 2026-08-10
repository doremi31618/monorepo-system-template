<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ServiceStatusBadge } from '@platform/service-ui';

  const { Story } = defineMeta({
    title: 'Service UI/ServiceStatusBadge',
    component: ServiceStatusBadge,
    tags: ['autodocs'],
  });
</script>

<Story name="Healthy" args={{ status: 'healthy' }} />
<Story name="Degraded" args={{ status: 'degraded' }} />
<Story name="Offline" args={{ status: 'offline' }} />
<Story name="Unknown" args={{ status: 'unknown' }} />
