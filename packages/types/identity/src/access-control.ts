export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface UserWithRoles {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  userRoles: Array<{ role: Role }>;
}

export const PermissionCodes = {
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
  },
} as const;

export type PermissionCode = string;
