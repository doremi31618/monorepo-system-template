import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service.js';
import { JobSchedulerPort } from './scheduling.port.js';
import { LoggerModule } from '@platform/logger';
import { SchedulingRepository } from './scheduling.repository.js';
@Module({
  imports: [
    LoggerModule,
  ],
  providers: [
    SchedulingService,
    SchedulingRepository,
    {
      provide: JobSchedulerPort,
      useExisting: SchedulingService,
    }
  ],
  exports: [JobSchedulerPort]
})
export class SchedulingModule { }
