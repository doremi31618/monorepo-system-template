export const PermissionSchema = {
    Users: {
        Read: 'users.read',
        Create: 'users.create',
        Update: 'users.update',
        Delete: 'users.delete',
        ManageRoles: 'users.roles.update',
    },
    Roles: {
        Read: 'roles.read',
        Create: 'roles.create',
        Update: 'roles.update',
        Delete: 'roles.delete',
        ManagePermissions: 'roles.permissions.update',
    },
    Permissions: {
        Read: 'permissions.read',
    }
} as const;

export type PermissionCode = string;
