import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { appConfig } from '@platform/config';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: appConfig.KEY,
          useValue: {
            env: 'dev'
          }
        }
      ],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
