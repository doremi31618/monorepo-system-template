import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { apiEnvSchema, validateApiEnv } from './env.validation.js';

describe('API environment validation', () => {
	it('keeps Root Admin credentials in the app-owned environment contract', () => {
		const env = validateApiEnv({
			SMTP_HOST: 'localhost',
			SMTP_PORT: '2525',
			SMTP_USER: 'test-user',
			SMTP_PASS: 'test-pass',
			SMTP_FROM: 'test@example.com',
			ROOT_ADMIN_EMAIL: 'owner@example.com',
			ROOT_ADMIN_NAME: 'Platform Owner',
			ROOT_ADMIN_PASSWORD: 'local-only-password'
		});

		expect(env).toMatchObject({
			PORT: 3333,
			ROOT_ADMIN_EMAIL: 'owner@example.com',
			ROOT_ADMIN_NAME: 'Platform Owner',
			ROOT_ADMIN_PASSWORD: 'local-only-password'
		});
	});

	it('accepts the test runtime used by Jest and API e2e suites', () => {
		const env = validateApiEnv({
			NODE_ENV: 'test',
			SMTP_HOST: 'localhost',
			SMTP_USER: 'test-user',
			SMTP_PASS: 'test-pass',
			SMTP_FROM: 'test@example.com',
			ROOT_ADMIN_EMAIL: 'owner@example.com',
			ROOT_ADMIN_NAME: 'Platform Owner',
			ROOT_ADMIN_PASSWORD: 'local-only-password'
		});

		expect(env.NODE_ENV).toBe('test');
	});

	it('keeps the committed API env example aligned with the validated contract', () => {
		const example = parse(
			readFileSync(new URL('../../.env.example', import.meta.url))
		);

		expect(Object.keys(example).sort()).toEqual(
			[...apiEnvSchema.keyof().options].sort()
		);
		expect(validateApiEnv(example)).toMatchObject({
			PORT: 3333,
			ROOT_ADMIN_EMAIL: 'admin@example.com',
			STORAGE_BUCKET: 'r3-assets'
		});
	});
});
