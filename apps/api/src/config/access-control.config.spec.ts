import { createAccessControlBootstrapConfig } from './access-control.config.js';
import { validateApiEnv } from './env.validation.js';

describe('API Access Control bootstrap config', () => {
	it('builds product roles and Root Admin credentials from the validated API environment', () => {
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

		const config = createAccessControlBootstrapConfig(env);

		expect(config.rootAdmin).toEqual({
			email: 'owner@example.com',
			name: 'Platform Owner',
			password: 'local-only-password',
			roleId: 'admin'
		});
		expect(config.rolePermissions.admin).toEqual(['*']);
		expect(config.permissions).toContainEqual({
			id: 'cms.posts.publish',
			module: 'cms',
			action: 'publish',
			description: 'Publish posts'
		});
	});
});
