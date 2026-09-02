<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ServiceCatalog } from '@platform/svelte-service-ui';

  const services = [
    {
      id: 'task-runtime',
      name: 'Task runtime',
      description:
        'Durable task claiming, leases, retries, and handler dispatch.',
      version: '0.1.0',
      status: 'healthy' as const,
      capabilities: [
        { id: 'claim', label: 'Claim' },
        { id: 'lease', label: 'Lease' },
        { id: 'retry', label: 'Retry' },
      ],
    },
    {
      id: 'event-runtime',
      name: 'Event runtime',
      description: 'Ordered event ingestion and projection checkpoints.',
      version: 'planned',
      status: 'degraded' as const,
      capabilities: [
        { id: 'inbox', label: 'Inbox' },
        { id: 'projection', label: 'Projection' },
      ],
    },
    {
      id: 'view-runtime',
      name: 'View runtime',
      description: 'Collection state and reusable Svelte view composition.',
      status: 'unknown' as const,
      capabilities: [],
    },
  ];

  const { Story } = defineMeta({
    title: 'Service UI/ServiceCatalog',
    component: ServiceCatalog,
    tags: ['autodocs'],
  });
</script>

<Story
  name="Platform services"
  args={{ services, heading: 'Platform services' }}
/>
<Story name="Empty" args={{ services: [], heading: 'Platform services' }} />
