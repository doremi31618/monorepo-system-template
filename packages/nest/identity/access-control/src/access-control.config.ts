import type { permissions, roles } from './access-control.schema.js';

export type AccessControlBootstrapConfig = {
  permissions: (typeof permissions.$inferInsert)[];
  roles: (typeof roles.$inferInsert)[];
  rolePermissions: Record<string, string[]>;
  rootAdmin: {
    email: string;
    name: string;
    password: string;
    roleId: string;
  };
};

export const ACCESS_CONTROL_BOOTSTRAP_CONFIG = Symbol(
  'ACCESS_CONTROL_BOOTSTRAP_CONFIG',
);
