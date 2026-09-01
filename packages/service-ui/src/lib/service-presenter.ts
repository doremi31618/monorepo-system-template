import type {
  ServiceStatus,
  ServiceStatusPresentation,
  ServiceSummary,
} from './service.types.js';

const statusPresentations: Record<ServiceStatus, ServiceStatusPresentation> = {
  healthy: { label: 'Healthy', tone: 'positive' },
  degraded: { label: 'Degraded', tone: 'warning' },
  offline: { label: 'Offline', tone: 'negative' },
  unknown: { label: 'Unknown', tone: 'neutral' },
};

export function presentServiceStatus(
  status: ServiceStatus,
): ServiceStatusPresentation {
  return statusPresentations[status];
}

export function sortServices(
  services: readonly ServiceSummary[],
): ServiceSummary[] {
  return [...services].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}
