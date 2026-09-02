import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { oauthAuditEvents } from './oauth-server.schema.js';
import type * as schema from './oauth-server.schema.js';

const SENSITIVE_KEY = /(token|secret|password|code|assertion|authorization)/i;

export function redactOAuthAuditDetails(
	value: Record<string, unknown>
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => {
			if (SENSITIVE_KEY.test(key)) return [key, '[REDACTED]'];
			if (item && typeof item === 'object' && !Array.isArray(item)) {
				return [key, redactOAuthAuditDetails(item as Record<string, unknown>)];
			}
			return [key, item];
		})
	);
}

export class PostgresOAuthAudit {
	constructor(private readonly db: NodePgDatabase<typeof schema>) {}

	async record(event: {
		eventType: string;
		outcome: 'success' | 'failure';
		actorId?: string;
		clientId?: string;
		resourceUri?: string;
		ipAddress?: string;
		userAgent?: string;
		details?: Record<string, unknown>;
	}): Promise<void> {
		await this.db.insert(oauthAuditEvents).values({
			...event,
			details: redactOAuthAuditDetails(event.details ?? {})
		});
	}
}
