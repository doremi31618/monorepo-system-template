
import { httpClient } from '../utils';
import type { Role, Permission, UserWithRoles, PaginatedResponse } from '@share/contract';

export type { Role, Permission, UserWithRoles };

export async function getRoles() {
    return await httpClient.get<Role[]>('/admin/roles');
}

export async function createRole(role: { name: string; description?: string; id?: string }) {
    return await httpClient.post<Role>('/admin/roles', role);
}

export async function updateRole(id: string, role: { name?: string; description?: string }) {
    return await httpClient.put<Role>(`/admin/roles/${id}`, role);
}

export async function deleteRole(id: string) {
    return await httpClient.delete(`/admin/roles/${id}`);
}

export async function getPermissions() {
    return await httpClient.get<Permission[]>('/admin/permissions');
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    return await httpClient.post<{ success: boolean }>(`/admin/roles/${roleId}/permissions`, { permissionIds });
}

export async function assignRoleToUser(userId: number, roleId: string) {
    return await httpClient.post<{ success: boolean }>(`/admin/users/${userId}/roles`, { roleId });
}

export async function removeRoleFromUser(userId: number, roleId: string) {
    return await httpClient.delete<{ success: boolean }>(`/admin/users/${userId}/roles/${roleId}`);
}

// User methods for admin
export interface CreateUserDto {
    name: string;
    email: string;
    password?: string;
    roleIds?: string[];
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    roleIds?: string[];
}

export interface UserQueryParams {
    page?: number;
    limit?: number;
    q?: string;
}

export async function getUsers(params?: UserQueryParams) {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            queryParams.set(key, String(value));
        });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    // Returns PaginatedResponse
    return await httpClient.get<PaginatedResponse<UserWithRoles>>('/admin/users' + query);
}

export async function getMe() {
    return await httpClient.get<UserWithRoles>('/admin/me');
}

export async function createUser(data: CreateUserDto) {
    return await httpClient.post<UserWithRoles>('/admin/users', data);
}

export async function getMyPermissions() {
    return await httpClient.get<string[]>('/admin/me/permissions');
}

export async function updateUser(userId: number, data: UpdateUserDto) {
    return await httpClient.put<UserWithRoles>(`/admin/users/${userId}`, data);
}

export async function deleteUser(userId: number) {
    return await httpClient.delete(`/admin/users/${userId}`);
}
