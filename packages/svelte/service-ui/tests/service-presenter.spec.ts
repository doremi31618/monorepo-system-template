import { describe, expect, it } from 'bun:test';
import {
  presentServiceStatus,
  sortServices,
} from '../src/lib/service-presenter.js';
import type { ServiceSummary } from '../src/lib/service.types.js';

describe('service presenter', () => {
  it('maps runtime status to stable presentation metadata', () => {
    expect(presentServiceStatus('healthy')).toEqual({
      label: 'Healthy',
      tone: 'positive',
    });
    expect(presentServiceStatus('degraded')).toEqual({
      label: 'Degraded',
      tone: 'warning',
    });
    expect(presentServiceStatus('offline')).toEqual({
      label: 'Offline',
      tone: 'negative',
    });
    expect(presentServiceStatus('unknown')).toEqual({
      label: 'Unknown',
      tone: 'neutral',
    });
  });

  it('sorts a copy without mutating the caller collection', () => {
    const services: ServiceSummary[] = [
      {
        id: 'tasks',
        name: 'Task runtime',
        status: 'healthy',
        capabilities: [],
      },
      {
        id: 'events',
        name: 'Event runtime',
        status: 'degraded',
        capabilities: [],
      },
    ];

    expect(sortServices(services).map((service) => service.id)).toEqual([
      'events',
      'tasks',
    ]);
    expect(services.map((service) => service.id)).toEqual(['tasks', 'events']);
  });
});
