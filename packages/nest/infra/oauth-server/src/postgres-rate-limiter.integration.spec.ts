import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { PostgresRateLimiter } from './postgres-rate-limiter.js';
import * as schema from './oauth-server.schema.js';

describe('PostgresRateLimiter', () => {
	const pool = new Pool({
		connectionString:
			process.env.TEST_DATABASE_URL ??
			'postgres://postgres:postgres@localhost:5432/postgres'
	});
	const db = drizzle(pool, { schema });

	beforeEach(async () => {
		await db.execute(sql`truncate table oauth_rate_limits`);
	});

	afterAll(async () => pool.end());

	it('rejects requests over a shared Postgres-backed limit', async () => {
		const limiter = new PostgresRateLimiter(db);

		await expect(
			limiter.consume('dcr', '192.0.2.1', 2, 60)
		).resolves.toMatchObject({ allowed: true });
		await expect(
			limiter.consume('dcr', '192.0.2.1', 2, 60)
		).resolves.toMatchObject({ allowed: true });
		await expect(
			limiter.consume('dcr', '192.0.2.1', 2, 60)
		).resolves.toMatchObject({ allowed: false });
	});
});
