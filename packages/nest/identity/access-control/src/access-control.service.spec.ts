import { Test, type TestingModule } from '@nestjs/testing';
import { LoggerService } from '@platform/nest-infra-logger';
import { AccessControlRepository } from './access-control.repository.js';
import {
  ACCESS_CONTROL_BOOTSTRAP_CONFIG,
  type AccessControlBootstrapConfig,
} from './access-control.config.js';
import { AccessControlService } from './access-control.service.js';

describe('AccessControlService bootstrap', () => {
  it('seeds the Root Admin supplied by the composition root', async () => {
    const config: AccessControlBootstrapConfig = {
      permissions: [
        {
          id: 'users.read',
          module: 'users',
          action: 'read',
          description: 'View users',
        },
      ],
      roles: [
        {
          id: 'platform-admin',
          name: 'Platform Administrator',
          description: 'Full platform access',
          isSystem: true,
        },
      ],
      rolePermissions: { 'platform-admin': ['*'] },
      rootAdmin: {
        email: 'owner@example.com',
        name: 'Platform Owner',
        password: 'local-only-password',
        roleId: 'platform-admin',
      },
    };
    const repository = {
      createPermissions: jest.fn().mockResolvedValue(undefined),
      findRoleById: jest.fn().mockResolvedValue(null),
      createRole: jest.fn().mockResolvedValue(undefined),
      getPermissions: jest.fn().mockResolvedValue(config.permissions),
      assignPermissionsToRole: jest.fn().mockResolvedValue(undefined),
      findUserByEmail: jest.fn().mockResolvedValue(null),
      createUser: jest.fn().mockResolvedValue([{ id: 41 }]),
      getUserRoles: jest.fn().mockResolvedValue([]),
      assignRoleToUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlService,
        { provide: AccessControlRepository, useValue: repository },
        { provide: ACCESS_CONTROL_BOOTSTRAP_CONFIG, useValue: config },
        {
          provide: LoggerService,
          useValue: { setContext: jest.fn(), log: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    await module.get(AccessControlService).onModuleInit();

    expect(repository.createUser).toHaveBeenCalledWith({
      email: 'owner@example.com',
      name: 'Platform Owner',
      password: 'local-only-password',
    });
    expect(repository.assignRoleToUser).toHaveBeenCalledWith(
      41,
      'platform-admin',
    );
  });
});
