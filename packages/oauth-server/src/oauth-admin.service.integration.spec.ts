import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { OAuthAdminService } from './oauth-admin.service.js';
import { verifyClientSecret } from './client-secret.js';
import * as schema from './oauth-server.schema.js';

describe('OAuthAdminService', () => {
	const pool = new Pool({
		connectionString:
			process.env.TEST_DATABASE_URL ??
			'postgres://postgres:postgres@localhost:5432/postgres'
	});
	const db = drizzle(pool, { schema });
	const service = new OAuthAdminService(db);

	beforeEach(async () => {
		await db.execute(
			sql`truncate table oauth_audit_events, oauth_clients, oauth_resources cascade`
		);
	});

	afterAll(async () => {
		await pool.end();
	});

	it('creates a confidential client and returns its secret only in the result', async () => {
		await service.createResource({
			uri: 'https://vocab.example/api',
			name: 'Vocab API',
			allowedScopes: ['vocab:read', 'vocab:write']
		});

		const created = await service.createClient({
			id: 'vocab-web',
			name: 'Vocab',
			clientType: 'confidential',
			redirectUris: ['https://vocab.example/auth/callback'],
			allowedScopes: ['openid', 'offline_access', 'vocab:read'],
			allowedResources: ['https://vocab.example/api']
		});

		expect(created.clientSecret).toEqual(expect.any(String));
		const rows = await db.execute<{ client_secret_hash: string }>(
			sql`select client_secret_hash from oauth_clients where id = 'vocab-web'`
		);
		expect(rows.rows[0]?.client_secret_hash).not.toBe(created.clientSecret);
		await expect(
			verifyClientSecret(
				created.clientSecret as string,
				rows.rows[0]?.client_secret_hash
			)
		).resolves.toBe(true);
		expect(await service.listClients()).toEqual([
			expect.not.objectContaining({ clientSecret: expect.anything() })
		]);
		const auditRows = await db.execute<{
			event_type: string;
			client_id: string | null;
			resource_uri: string | null;
		}>(sql`
			select event_type, client_id, resource_uri
			from oauth_audit_events
			order by created_at
		`);
		expect(auditRows.rows).toEqual([
			expect.objectContaining({
				event_type: 'resource.created',
				resource_uri: 'https://vocab.example/api'
			}),
			expect.objectContaining({
				event_type: 'client.created',
				client_id: 'vocab-web'
			})
		]);
	});
});
