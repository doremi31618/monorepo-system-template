
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from './access-control.service.js';
import { PERMISSIONS_KEY } from './permissions.decorator.js';

@Injectable()
export class RBACGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private accessControlService: AccessControlService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.id) {
            return false;
        }

        const userPermissions = await this.accessControlService.getUserPermissions(user.id);
        return requiredPermissions.every((permission) => userPermissions.includes(permission));
    }
}
