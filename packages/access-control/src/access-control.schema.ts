
import { pgTable, text, timestamp, boolean, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '@platform/users';

export const roles = pgTable('roles', {
    id: text('id').primaryKey(), // Using text ID (e.g. 'admin', 'editor') or CUID
    name: text('name').notNull().unique(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
    id: text('id').primaryKey(), // formatted as 'module.action' e.g. 'users.create'
    module: text('module').notNull(),
    action: text('action').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
    userId: integer('user_id').notNull().references(() => users.id),
    roleId: text('role_id').notNull().references(() => roles.id),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const rolePermissions = pgTable('role_permissions', {
    roleId: text('role_id').notNull().references(() => roles.id),
    permissionId: text('permission_id').notNull().references(() => permissions.id),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}));
