import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from './scheduling.service';
import { SchedulingRepository } from './scheduling.repository';
import { LoggerService } from '@platform/logger';
import { appConfig } from '@platform/config';

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
            getPendingJobs: jest.fn().mockResolvedValue([])
          }
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn()
          }
        },
        {
          provide: appConfig.KEY,
          useValue: {
            workerId: 'test-worker'
          }
        }
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
