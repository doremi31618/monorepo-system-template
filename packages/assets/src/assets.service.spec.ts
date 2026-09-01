import type { ConfigService } from '@nestjs/config';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssetsService } from './assets.service.js';
import type { IStorageStrategy } from './storage/storage.interface.js';

describe('AssetsService', () => {
  it('creates a pending asset after obtaining an upload URL', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const db = {
      insert: jest.fn().mockReturnValue({ values }),
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('uploads'),
      get: jest.fn().mockReturnValue('s3'),
    };
    const storage = {
      presignPut: jest.fn().mockResolvedValue('https://uploads.example/file'),
    };
    const service = new AssetsService(
      db as unknown as NodePgDatabase<Record<string, never>>,
      config as unknown as ConfigService,
      storage as unknown as IStorageStrategy,
    );

    const result = await service.initUpload(
      'report.pdf',
      'application/pdf',
      512,
      7,
    );

    expect(storage.presignPut).toHaveBeenCalledWith({
      key: result.storageKey,
      contentType: 'application/pdf',
      expiresIn: 3600,
    });
    expect(result.storageKey).toMatch(/^7\/[0-9a-f-]+\.pdf$/);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.assetId,
        originalName: 'report.pdf',
        status: 'pending',
        ownerId: 7,
      }),
    );
  });
});
