import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AccessControlRepository } from './access-control.repository.js';
import { LoggerService } from '@platform/nest-infra-logger';
import {
  ACCESS_CONTROL_BOOTSTRAP_CONFIG,
  type AccessControlBootstrapConfig,
} from './access-control.config.js';

@Injectable()
export class AccessControlService implements OnModuleInit {
  constructor(
    private readonly repository: AccessControlRepository,
    private readonly logger: LoggerService,
    @Inject(ACCESS_CONTROL_BOOTSTRAP_CONFIG)
    private readonly config: AccessControlBootstrapConfig,
  ) {
    this.logger.setContext(AccessControlService.name);
  }

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedRootAdmin();
  }

  private async seedPermissions() {
    const permissions = this.config.permissions;
    await this.repository.createPermissions(permissions);
  }

  private async seedRoles() {
    for (const role of this.config.roles) {
      const exists = await this.repository.findRoleById(role.id);
      if (!exists) {
        await this.repository.createRole(role);
      }

      // Assign default permissions to roles
      const rolePerms = this.config.rolePermissions[role.id];
      if (rolePerms) {
        let permIds: string[] = [];
        if (rolePerms.includes('*')) {
          // Assign all permissions
          const allPerms = await this.repository.getPermissions();
          permIds = allPerms.map((p) => p.id);
        } else {
          permIds = rolePerms;
        }
        await this.repository.assignPermissionsToRole(role.id, permIds);
      }
    }
  }

  private async seedRootAdmin() {
    // Root admin logic is now simplified as roles are seeded separately
    const { email, name, password, roleId } = this.config.rootAdmin;
    let rootUser = await this.repository.findUserByEmail(email);

    if (!rootUser) {
      this.logger.log('Creating Root Admin user...');
      [rootUser] = await this.repository.createUser({
        email,
        name,
        password, // TODO: Change this or specific via env
      });
    }

    if (rootUser) {
      const hasRole = await this.repository.getUserRoles(rootUser.id);
      if (!hasRole.some((r) => r.id === roleId)) {
        await this.repository.assignRoleToUser(rootUser.id, roleId);
      }
    }
  }

  async getRoles(options?: { search?: string; kind?: 'system' | 'custom'; sort?: string | string[] }) {
    return this.repository.getRoles(options);
  }

  async createRole(name: string, description?: string, id?: string) {
    // Simple id generation if not provided (slugify name)
    const roleId = id || name.toLowerCase().replace(/\s+/g, '-');
    return this.repository.createRole({ id: roleId, name, description });
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    // Prevent updating system roles
    const role = await this.repository.findRoleById(id);
    if (role?.isSystem) {
      throw new Error('Cannot modify system roles');
    }
    return this.repository.updateRole(id, data);
  }

  async deleteRole(id: string) {
    // Prevent deleting system roles
    const role = await this.repository.findRoleById(id);
    if (role?.isSystem) {
      throw new Error('Cannot delete system roles');
    }
    return this.repository.deleteRole(id);
  }

  async getPermissions() {
    return this.repository.getPermissions();
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    // Transactional could be better
    await this.repository.removePermissionsFromRole(roleId);
    return this.repository.assignPermissionsToRole(roleId, permissionIds);
  }

  async assignRoleToUser(userId: number, roleId: string) {
    return this.repository.assignRoleToUser(userId, roleId);
  }

  async getUserPermissions(userId: number) {
    // Implement caching here if needed
    return this.repository.getUserPermissions(userId);
  }

  async hasPermission(userId: number, requiredPermission: string) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  }

  async getUsers(options?: { page?: number; limit?: number; search?: string; roleIds?: string[]; sort?: string | string[] }) {
    return this.repository.getUsers(options);
  }

  async updateUser(
    id: number,
    data: { name?: string; email?: string; roleIds?: string[] },
  ) {
    // Prevent updating root admin (system admin)
    const user = await this.repository.findUserById(id);
    if (user?.email === this.config.rootAdmin.email) {
      throw new Error('Cannot modify root admin user');
    }

    if (data.roleIds) {
      // Smart sync: get current roles, then add/remove only differences
      const currentRoles = await this.repository.getUserRoles(id);
      const currentRoleIds = currentRoles.map((r) => r.id);
      const newRoleIds = data.roleIds;

      // Remove roles that are no longer assigned
      const rolesToRemove = currentRoleIds.filter(
        (roleId) => !newRoleIds.includes(roleId),
      );
      for (const roleId of rolesToRemove) {
        await this.repository.removeRoleFromUser(id, roleId);
      }

      // Add new roles
      const rolesToAdd = newRoleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      );
      for (const roleId of rolesToAdd) {
        await this.repository.assignRoleToUser(id, roleId);
      }
    }
    return this.repository.updateUser(id, {
      name: data.name,
      email: data.email,
    });
  }

  async getUserProfile(userId: number) {
    return this.repository.findUserById(userId);
  }

  async createUser(data: any) {
    const [user] = await this.repository.createUser(data);

    // Assign roles if provided
    if (data.roleIds && Array.isArray(data.roleIds)) {
      for (const roleId of data.roleIds) {
        await this.repository.assignRoleToUser(user.id, roleId);
      }
    }

    return user;
  }

  async deleteUser(userId: number) {
    // Prevent deleting root admin (system admin)
    const user = await this.repository.findUserById(userId);
    if (user?.email === this.config.rootAdmin.email) {
      throw new Error('Cannot delete root admin user');
    }
    return this.repository.deleteUser(userId);
  }

  async removeRoleFromUser(userId: number, roleId: string) {
    return this.repository.removeRoleFromUser(userId, roleId);
  }
}
