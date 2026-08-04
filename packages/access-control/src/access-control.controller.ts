import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AccessControlService } from './access-control.service.js';
import { AuthGuard } from '@platform/auth';
import { RBACGuard } from './rbac.guard.js';
import { RequirePermissions } from './permissions.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PermissionSchema } from '@platform/contracts';

@ApiTags('Admin - Access Control')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthGuard, RBACGuard)
export class AccessControlController {
    constructor(private readonly service: AccessControlService) { }

    @Get('roles')
    @RequirePermissions(PermissionSchema.Roles.Read)
    @ApiOperation({ summary: 'Get all roles', description: 'Retrieve all system roles with their permissions' })
    @ApiResponse({ status: 200, description: 'List of roles returned successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.read permission' })
    async getRoles() {
        return this.service.getRoles();
    }

    @Post('roles')
    @RequirePermissions(PermissionSchema.Roles.Create)
    @ApiOperation({ summary: 'Create a new role', description: 'Create a new role with optional permissions' })
    @ApiBody({ schema: { properties: { name: { type: 'string' }, description: { type: 'string' }, id: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: 'Role created successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.create permission' })
    async createRole(@Body() body: { name: string; description?: string; id?: string }) {
        return this.service.createRole(body.name, body.description, body.id);
    }

    @Put('roles/:id')
    @RequirePermissions(PermissionSchema.Roles.Update)
    @ApiOperation({ summary: 'Update a role', description: 'Update role name and/or description' })
    @ApiParam({ name: 'id', description: 'Role ID' })
    @ApiBody({ schema: { properties: { name: { type: 'string' }, description: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.update permission' })
    async updateRole(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
        return this.service.updateRole(id, body);
    }

    @Delete('roles/:id')
    @RequirePermissions(PermissionSchema.Roles.Delete)
    @ApiOperation({ summary: 'Delete a role', description: 'Permanently delete a role' })
    @ApiParam({ name: 'id', description: 'Role ID' })
    @ApiResponse({ status: 200, description: 'Role deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.delete permission' })
    async deleteRole(@Param('id') id: string) {
        return this.service.deleteRole(id);
    }

    @Get('permissions')
    @RequirePermissions(PermissionSchema.Permissions.Read)
    @ApiOperation({ summary: 'Get all permissions', description: 'Retrieve all available system permissions' })
    @ApiResponse({ status: 200, description: 'List of permissions returned successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing permissions.read permission' })
    async getPermissions() {
        return this.service.getPermissions();
    }

    @Post('roles/:id/permissions')
    @RequirePermissions(PermissionSchema.Roles.ManagePermissions)
    @ApiOperation({ summary: 'Update role permissions', description: 'Assign permissions to a role' })
    @ApiParam({ name: 'id', description: 'Role ID' })
    @ApiBody({ schema: { properties: { permissionIds: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 200, description: 'Role permissions updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing roles.permissions.update permission' })
    async updateRolePermissions(@Param('id') id: string, @Body() body: { permissionIds: string[] }) {
        return this.service.updateRolePermissions(id, body.permissionIds);
    }

    @Post('users/:userId/roles')
    @RequirePermissions(PermissionSchema.Users.ManageRoles)
    @ApiOperation({ summary: 'Assign role to user', description: 'Assign a specific role to a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiBody({ schema: { properties: { roleId: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Role assigned to user successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.roles.update permission' })
    async assignRoleToUser(@Param('userId') userId: string, @Body() body: { roleId: string }) {
        // Ensure userId is parsed as integer
        return this.service.assignRoleToUser(parseInt(userId, 10), body.roleId);
    }

    @Delete('users/:userId/roles/:roleId')
    @RequirePermissions(PermissionSchema.Users.ManageRoles)
    @ApiOperation({ summary: 'Remove role from user', description: 'Remove a specific role from a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiParam({ name: 'roleId', description: 'Role ID' })
    @ApiResponse({ status: 200, description: 'Role removed from user successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.roles.update permission' })
    async removeRoleFromUser(@Param('userId') userId: string, @Param('roleId') roleId: string) {
        return this.service.removeRoleFromUser(parseInt(userId, 10), roleId);
    }

    @Get('users')
    @RequirePermissions(PermissionSchema.Users.Read)
    @ApiOperation({ summary: 'Get all users', description: 'Retrieve paginated list of users with roles' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    @ApiQuery({ name: 'q', required: false, description: 'Search query (name or email)' })
    @ApiResponse({ status: 200, description: 'Paginated user list returned successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.read permission' })
    async getUsers(@Query() query: { page?: string; limit?: string; q?: string }) {
        return this.service.getUsers({
            page: query.page ? parseInt(query.page) : undefined,
            limit: query.limit ? parseInt(query.limit) : undefined,
            search: query.q
        });
    }

    @Post('users')
    @RequirePermissions(PermissionSchema.Users.Create)
    @ApiOperation({ summary: 'Create a new user', description: 'Create a new user with email and password' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.create permission' })
    async createUser(@Body() dto: CreateUserDto) {
        return this.service.createUser(dto);
    }

    @Delete('users/:userId')
    @RequirePermissions(PermissionSchema.Users.Delete)
    @ApiOperation({ summary: 'Delete a user', description: 'Permanently delete a user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.delete permission' })
    async deleteUser(@Param('userId') userId: string) {
        return this.service.deleteUser(parseInt(userId));
    }

    @Put('users/:userId')
    @RequirePermissions(PermissionSchema.Users.Update)
    @ApiOperation({ summary: 'Update a user', description: 'Update user profile and optionally change roles (multi-role support)' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiBody({ schema: { properties: { name: { type: 'string' }, email: { type: 'string' }, roleIds: { type: 'array', items: { type: 'string' } } } } })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Missing users.update permission' })
    async updateUser(@Param('userId') userId: string, @Body() body: { name?: string; email?: string; roleIds?: string[] }) {
        return this.service.updateUser(parseInt(userId), body);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile', description: 'Get authenticated user profile with roles' })
    @ApiResponse({ status: 200, description: 'User profile returned successfully' })
    async getMe(@Req() req) {
        return this.service.getUserProfile(req.user.id);
    }

    @Get('me/permissions')
    @ApiOperation({ summary: 'Get current user permissions', description: 'Get list of permissions for the authenticated user' })
    @ApiResponse({ status: 200, description: 'User permissions returned successfully' })
    async getMyPermissions(@Req() req) {
        return this.service.getUserPermissions(req.user.id);
    }
}
