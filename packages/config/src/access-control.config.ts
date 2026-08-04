import { PermissionSchema } from '@platform/contracts';

// Derive permissions from schema
const permissions = [
    // Users
    { id: PermissionSchema.Users.Read, module: 'users', action: 'read', description: 'View users' },
    { id: PermissionSchema.Users.Create, module: 'users', action: 'create', description: 'Create users' },
    { id: PermissionSchema.Users.Update, module: 'users', action: 'update', description: 'Update users' },
    { id: PermissionSchema.Users.Delete, module: 'users', action: 'delete', description: 'Delete users' },
    { id: PermissionSchema.Users.ManageRoles, module: 'users', action: 'update_roles', description: 'Update user roles' },

    // Roles
    { id: PermissionSchema.Roles.Read, module: 'roles', action: 'read', description: 'View roles' },
    { id: PermissionSchema.Roles.Create, module: 'roles', action: 'create', description: 'Create roles' },
    { id: PermissionSchema.Roles.Update, module: 'roles', action: 'update', description: 'Update roles' },
    { id: PermissionSchema.Roles.Delete, module: 'roles', action: 'delete', description: 'Delete roles' },
    { id: PermissionSchema.Roles.ManagePermissions, module: 'roles', action: 'update_permissions', description: 'Update role permissions' },

    // Permissions
    { id: PermissionSchema.Permissions.Read, module: 'permissions', action: 'read', description: 'View permissions' },

    // Assets
    { id: 'assets.create', module: 'assets', action: 'create', description: 'Upload assets' },
    { id: 'assets.read', module: 'assets', action: 'read', description: 'View assets' },

    // CMS
    { id: 'cms.posts.create', module: 'cms', action: 'create', description: 'Create posts' },
    { id: 'cms.posts.read', module: 'cms', action: 'read', description: 'View posts' },
    { id: 'cms.posts.update', module: 'cms', action: 'update', description: 'Update posts' },
    { id: 'cms.posts.publish', module: 'cms', action: 'publish', description: 'Publish posts' },
];

export const ACCESS_CONTROL_CONFIG = {
    roles: [
        {
            id: 'admin',
            name: 'Administrator',
            description: 'System Administrator with full access',
            isSystem: true,
        },
        {
            id: 'user',
            name: 'User',
            description: 'Standard user',
            isSystem: true,
        },
    ],
    permissions,
    // Map roles to permissions
    rolePermissions: {
        'admin': ['*'] as string[], // '*' means all permissions
        'user': [PermissionSchema.Users.Read] as string[],
    },
    rootAdmin: {
        email: 'admin@system.com',
        name: 'System Admin',
        password: 'admin123'
    }
};
