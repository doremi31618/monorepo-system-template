import { AccessControlService } from './access-control.service.js';
import type { AccessControlRepository } from './access-control.repository.js';
import type { LoggerService } from '@platform/logger';

describe('AccessControlService', () => {
  function createService(repositoryOverrides: Record<string, unknown> = {}) {
    const repository = {
      findRoleById: jest.fn(),
      updateRole: jest.fn(),
      getUserPermissions: jest.fn(),
      ...repositoryOverrides,
    };
    const logger = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    return {
      repository,
      service: new AccessControlService(
        repository as unknown as AccessControlRepository,
        logger as unknown as LoggerService,
      ),
    };
  }

  it('prevents updates to system roles', async () => {
    const { repository, service } = createService({
      findRoleById: jest
        .fn()
        .mockResolvedValue({ id: 'admin', isSystem: true }),
    });

    await expect(
      service.updateRole('admin', { name: 'Changed' }),
    ).rejects.toThrow('Cannot modify system roles');
    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('checks permissions through the repository boundary', async () => {
    const { service } = createService({
      getUserPermissions: jest
        .fn()
        .mockResolvedValue(['users.read', 'users.write']),
    });

    await expect(service.hasPermission(42, 'users.write')).resolves.toBe(true);
    await expect(service.hasPermission(42, 'users.delete')).resolves.toBe(
      false,
    );
  });
});
