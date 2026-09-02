
import { Injectable } from '@nestjs/common';
import { eq, and, asc, desc, ilike, inArray, or, relations } from 'drizzle-orm';
import { BaseRepository } from '@platform/nest-infra-database';
import { roles, permissions, rolePermissions, userRoles } from './access-control.schema.js';
import { users } from '@platform/nest-identity-users';
import * as accessControlSchema from './access-control.schema.js';
import * as bcrypt from 'bcrypt';
import { parseUserSorts, type UserSortProperty } from './list-users-query.js';
import { parseRoleSorts, type RoleSortProperty } from './list-roles-query.js';

const usersRelationsForRepository = relations(users, ({ many }) => ({
    userRoles: many(userRoles),
}));

const repositorySchema = {
    ...accessControlSchema,
    users,
    usersRelationsForRepository,
};

@Injectable()
export class AccessControlRepository extends BaseRepository<typeof repositorySchema> {

    // Roles
    async getRoles(options?: { search?: string; kind?: 'system' | 'custom'; sort?: string | string[] }) {
        const conditions: any[] = [];
        if (options?.search) {
            conditions.push(or(
                ilike(roles.name, `%${options.search}%`),
                ilike(roles.description, `%${options.search}%`),
            ));
        }
        if (options?.kind) {
            conditions.push(eq(roles.isSystem, options.kind === 'system'));
        }
        const sortColumns: Record<RoleSortProperty, any> = {
            name: roles.name,
            createdAt: roles.createdAt,
        };
        const orderBy = [
            ...parseRoleSorts(options?.sort).map((sort) =>
                sort.direction === 'asc'
                    ? asc(sortColumns[sort.property])
                    : desc(sortColumns[sort.property]),
            ),
            asc(roles.id),
        ];
        return this.db.query.roles.findMany({
            where: conditions.length ? and(...conditions) : undefined,
            orderBy,
            with: {
                rolePermissions: {
                    with: {
                        permission: true
                    }
                }
            }
        });
    }

    async findRoleById(id: string) {
        return this.db.query.roles.findFirst({
            where: eq(roles.id, id)
        });
    }

    async createRole(role: typeof roles.$inferInsert) {
        return this.db.insert(roles).values(role).returning();
    }

    async updateRole(id: string, data: Partial<typeof roles.$inferInsert>) {
        return this.db.update(roles).set(data).where(eq(roles.id, id)).returning();
    }

    async deleteRole(id: string) {
        return this.db.delete(roles).where(eq(roles.id, id)).returning();
    }

    // Permissions
    async getPermissions() {
        return this.db.select().from(permissions);
    }

    async createPermissions(perms: (typeof permissions.$inferInsert)[]) {
        return this.db.insert(permissions).values(perms).onConflictDoNothing().returning();
    }

    // Relations
    async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
        if (permissionIds.length === 0) return [];
        const values = permissionIds.map(pid => ({ roleId, permissionId: pid }));
        return this.db.insert(rolePermissions).values(values).onConflictDoNothing().returning();
    }

    async removePermissionsFromRole(roleId: string) {
        return this.db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    }

    async assignRoleToUser(userId: number, roleId: string) {
        return this.db.insert(userRoles).values({ userId, roleId }).onConflictDoNothing().returning();
    }

    async removeRoleFromUser(userId: number, roleId: string) {
        return this.db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    }

    async removeAllRolesFromUser(userId: number) {
        return this.db.delete(userRoles).where(eq(userRoles.userId, userId));
    }

    async getUserPermissions(userId: number): Promise<string[]> {
        const result = await this.db
            .select({ permissionId: rolePermissions.permissionId })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
            .where(eq(userRoles.userId, userId));

        return result.map(r => r.permissionId);
    }

    async findUserByEmail(email: string) {
        return this.db.query.users.findFirst({
            where: eq(users.email, email)
        });
    }

    async findUserById(id: number) {
        return this.db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                userRoles: {
                    with: {
                        role: true
                    }
                }
            }
        });
    }

    async createUser(data: any) {
        // Hash password if provided
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        return this.db.insert(users).values(data).returning();
    }



    async getUserRoles(userId: number) {
        const result = await this.db.query.userRoles.findMany({
            where: eq(userRoles.userId, userId),
            with: {
                role: true
            }
        });
        return result.map(ur => ur.role);
    }

    async getUsers(options?: { page?: number; limit?: number; search?: string; roleIds?: string[]; sort?: string | string[] }) {
        const conditions: any[] = [];
        if (options?.search) {
            conditions.push(or(ilike(users.name, `%${options.search}%`), ilike(users.email, `%${options.search}%`)));
        }
        if (options?.roleIds?.length) {
            const usersWithRoles = this.db
                .select({ userId: userRoles.userId })
                .from(userRoles)
                .where(inArray(userRoles.roleId, options.roleIds));
            conditions.push(inArray(users.id, usersWithRoles));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const sortColumns: Record<UserSortProperty, any> = {
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
        };
        const orderBy = [
            ...parseUserSorts(options?.sort).map((sort) =>
                sort.direction === 'asc'
                    ? asc(sortColumns[sort.property])
                    : desc(sortColumns[sort.property]),
            ),
            asc(users.id),
        ];

        // Calculate total count (simplified for Drizzle)
        const allUsers = await this.db.query.users.findMany({
            where: whereClause,
            columns: { id: true }
        });
        const total = allUsers.length;

        const data = await this.db.query.users.findMany({
            where: whereClause,
            with: {
                userRoles: {
                    with: {
                        role: true
                    }
                }
            },
            orderBy,
            limit: options?.limit,
            offset: options?.page && options?.limit ? (options.page - 1) * options.limit : undefined
        });

        return {
            data,
            meta: {
                total,
                page: options?.page || 1,
                limit: options?.limit || total
            }
        };
    }
    async updateUser(id: number, data: { name?: string; email?: string }) {
        return this.db.update(users).set(data).where(eq(users.id, id)).returning();
    }

    async deleteUser(id: number) {
        return this.db.delete(users).where(eq(users.id, id)).returning();
    }
}
