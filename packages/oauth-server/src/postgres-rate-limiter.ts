import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './oauth-server.schema.js';

export class PostgresRateLimiter {
	constructor(
		private readonly db: NodePgDatabase<typeof schema>,
		private readonly now: () => Date = () => new Date()
	) {}

	async consume(
		bucket: string,
		subject: string,
		limit: number,
		windowSeconds: number
	): Promise<{
		allowed: boolean;
		remaining: number;
		retryAfterSeconds: number;
	}> {
		if (limit < 1 || windowSeconds < 1) {
			throw new TypeError('Rate limit and window must be positive');
		}
		const now = this.now();
		const subjectHash = createHash('sha256')
			.update(subject, 'utf8')
			.digest('hex');
		const result = await this.db.execute<{
			request_count: number;
			window_started_at: Date;
		}>(sql`
      insert into oauth_rate_limits (
        bucket, subject_hash, window_started_at, request_count, updated_at
      ) values (
        ${bucket}, ${subjectHash}, ${now}, 1, ${now}
      )
      on conflict (bucket, subject_hash) do update set
        request_count = case
          when oauth_rate_limits.window_started_at <= ${now}::timestamptz - make_interval(secs => ${windowSeconds}::int) then 1
          else oauth_rate_limits.request_count + 1
        end,
        window_started_at = case
          when oauth_rate_limits.window_started_at <= ${now}::timestamptz - make_interval(secs => ${windowSeconds}::int) then ${now}
          else oauth_rate_limits.window_started_at
        end,
        updated_at = ${now}
      returning request_count, window_started_at
    `);
		const row = result.rows[0];
		const count = row?.request_count ?? limit + 1;
		const windowStartedAt = new Date(row?.window_started_at ?? now);
		const retryAfterSeconds = Math.max(
			0,
			Math.ceil(
				(windowStartedAt.getTime() + windowSeconds * 1000 - now.getTime()) /
					1000
			)
		);
		return {
			allowed: count <= limit,
			remaining: Math.max(0, limit - count),
			retryAfterSeconds
		};
	}
}
