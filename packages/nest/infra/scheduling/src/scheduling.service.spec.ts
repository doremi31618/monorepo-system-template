import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { SchedulingRepository } from './scheduling.repository';
import { LoggerService } from '@platform/nest-infra-logger';
import schedulingConfig from './scheduling.config';

describe('SchedulingService', () => {
  let service: SchedulingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: SchedulingRepository,
          useValue: {
            createJob: jest.fn(),
            getPendingJobs: jest.fn().mockResolvedValue([]),
          },
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
          provide: schedulingConfig.KEY,
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

  it('stops polling when the module is destroyed', async () => {
    jest.useFakeTimers();

    service.onModuleInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(jest.getTimerCount()).toBe(1);
    service.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);

    jest.useRealTimers();
  });
});
