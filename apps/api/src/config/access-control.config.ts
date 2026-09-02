import type { AccessControlBootstrapConfig } from '@platform/nest-identity-access-control';
import type { ApiEnv } from './env.validation.js';

type RootAdminEnv = Pick<
	ApiEnv,
	'ROOT_ADMIN_EMAIL' | 'ROOT_ADMIN_NAME' | 'ROOT_ADMIN_PASSWORD'
>;

const permissions: AccessControlBootstrapConfig['permissions'] = [
	{
		id: 'users.read',
		module: 'users',
		action: 'read',
		description: 'View users'
	},
	{
		id: 'users.create',
		module: 'users',
		action: 'create',
		description: 'Create users'
	},
	{
		id: 'users.update',
		module: 'users',
		action: 'update',
		description: 'Update users'
	},
	{
		id: 'users.delete',
		module: 'users',
		action: 'delete',
		description: 'Delete users'
	},
	{
		id: 'users.roles.update',
		module: 'users',
		action: 'update_roles',
		description: 'Update user roles'
	},
	{
		id: 'roles.read',
		module: 'roles',
		action: 'read',
		description: 'View roles'
	},
	{
		id: 'roles.create',
		module: 'roles',
		action: 'create',
		description: 'Create roles'
	},
	{
		id: 'roles.update',
		module: 'roles',
		action: 'update',
		description: 'Update roles'
	},
	{
		id: 'roles.delete',
		module: 'roles',
		action: 'delete',
		description: 'Delete roles'
	},
	{
		id: 'roles.permissions.update',
		module: 'roles',
		action: 'update_permissions',
		description: 'Update role permissions'
	},
	{
		id: 'permissions.read',
		module: 'permissions',
		action: 'read',
		description: 'View permissions'
	},
	{
		id: 'assets.create',
		module: 'assets',
		action: 'create',
		description: 'Upload assets'
	},
	{
		id: 'assets.read',
		module: 'assets',
		action: 'read',
		description: 'View assets'
	},
	{
		id: 'cms.posts.create',
		module: 'cms',
		action: 'create',
		description: 'Create posts'
	},
	{
		id: 'cms.posts.read',
		module: 'cms',
		action: 'read',
		description: 'View posts'
	},
	{
		id: 'cms.posts.update',
		module: 'cms',
		action: 'update',
		description: 'Update posts'
	},
	{
		id: 'cms.posts.publish',
		module: 'cms',
		action: 'publish',
		description: 'Publish posts'
	}
];

export function createAccessControlBootstrapConfig(
	env: RootAdminEnv
): AccessControlBootstrapConfig {
	return {
		permissions,
		roles: [
			{
				id: 'admin',
				name: 'Administrator',
				description: 'System Administrator with full access',
				isSystem: true
			},
			{
				id: 'user',
				name: 'User',
				description: 'Standard user',
				isSystem: true
			}
		],
		rolePermissions: {
			admin: ['*'],
			user: ['users.read']
		},
		rootAdmin: {
			email: env.ROOT_ADMIN_EMAIL,
			name: env.ROOT_ADMIN_NAME,
			password: env.ROOT_ADMIN_PASSWORD,
			roleId: 'admin'
		}
	};
}
