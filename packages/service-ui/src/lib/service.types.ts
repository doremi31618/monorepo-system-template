export type ServiceStatus = 'healthy' | 'degraded' | 'offline' | 'unknown';

export interface ServiceCapability {
  id: string;
  label: string;
  description?: string;
}

export interface ServiceSummary {
  id: string;
  name: string;
  description?: string;
  version?: string;
  status: ServiceStatus;
  capabilities: ServiceCapability[];
}

export type ServiceStatusTone = 'positive' | 'warning' | 'negative' | 'neutral';

export interface ServiceStatusPresentation {
  label: string;
  tone: ServiceStatusTone;
}
