import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { SchedulingRepository } from './scheduling.repository';
import { LoggerService } from '@platform/logger';
import { appConfig } from '@platform/config';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let repository: {
    createJob: jest.Mock;
    getPendingJobs: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      createJob: jest.fn().mockResolvedValue(undefined),
      getPendingJobs: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: SchedulingRepository,
          useValue: repository,
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: {
            workerId: 'test-worker',
          },
        },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('propagates persistence failures to the producer', async () => {
    repository.createJob.mockRejectedValueOnce(
      new Error('database unavailable'),
    );

    await expect(
      service.schedule('example', { id: 1 }, new Date()),
    ).rejects.toThrow('database unavailable');
  });

  it('rejects duplicate handler registration', () => {
    const handler = async () => undefined;
    service.registerHandler('example', handler);

    expect(() => service.registerHandler('example', handler)).toThrow(
      'A handler is already registered for job: example',
    );
  });
});
