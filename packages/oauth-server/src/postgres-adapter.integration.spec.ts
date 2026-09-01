import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import {
	AdapterConsumeConflictError,
	PostgresOAuthClientAdapter,
	PostgresOAuthAdapter
} from './postgres-adapter.js';
import * as schema from './oauth-server.schema.js';

describe('PostgresOAuthAdapter', () => {
	const pool = new Pool({
		connectionString:
			process.env.TEST_DATABASE_URL ??
			'postgres://postgres:postgres@localhost:5432/postgres'
	});
	const db = drizzle(pool, { schema });

	beforeEach(async () => {
		await db.execute(
			sql`truncate table oauth_clients, oauth_artifacts cascade`
		);
	});

	afterAll(async () => {
		await pool.end();
	});

	it('persists an artifact without storing its bearer value', async () => {
		const adapter = new PostgresOAuthAdapter('AuthorizationCode', db);

		await adapter.upsert(
			'raw-authorization-code',
			{ accountId: '42', jti: 'raw-authorization-code' },
			300
		);

		await expect(adapter.find('raw-authorization-code')).resolves.toMatchObject(
			{
				accountId: '42'
			}
		);
		const rows = await db.execute<{ id_hash: string; payload_text: string }>(
			sql`select id_hash, payload::text as payload_text from oauth_artifacts`
		);
		expect(rows.rows[0]?.id_hash).not.toContain('raw-authorization-code');
		expect(rows.rows[0]?.payload_text).not.toContain('raw-authorization-code');
	});

	it('allows only one instance to atomically consume an artifact', async () => {
		const firstInstance = new PostgresOAuthAdapter('AuthorizationCode', db);
		const secondInstance = new PostgresOAuthAdapter('AuthorizationCode', db);
		await firstInstance.upsert('single-use-code', { accountId: '42' }, 300);

		const results = await Promise.allSettled([
			firstInstance.consume('single-use-code'),
			secondInstance.consume('single-use-code')
		]);

		expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
			1
		);
		const rejected = results.find(({ status }) => status === 'rejected');
		expect(rejected).toMatchObject({
			status: 'rejected',
			reason: expect.any(AdapterConsumeConflictError)
		});
		await expect(firstInstance.find('single-use-code')).resolves.toMatchObject({
			consumed: expect.any(Number)
		});
	});

	it('persists a dynamically registered public client', async () => {
		const adapter = new PostgresOAuthClientAdapter(db);

		await adapter.upsert('chatgpt-client', {
			client_id: 'chatgpt-client',
			client_id_issued_at: Math.floor(Date.now() / 1000),
			client_name: 'ChatGPT',
			redirect_uris: ['https://chatgpt.com/connector/oauth/callback'],
			token_endpoint_auth_method: 'none',
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			scope: 'openid mcp:tools offline_access',
			allowed_resources: ['https://mcp.example/mcp']
		});

		await expect(adapter.find('chatgpt-client')).resolves.toMatchObject({
			client_id: 'chatgpt-client',
			token_endpoint_auth_method: 'none',
			redirect_uris: ['https://chatgpt.com/connector/oauth/callback']
		});
		const rows = await db.execute<{ dynamic: boolean }>(
			sql`select dynamic from oauth_clients where id = 'chatgpt-client'`
		);
		expect(rows.rows[0]?.dynamic).toBe(true);
	});
});
