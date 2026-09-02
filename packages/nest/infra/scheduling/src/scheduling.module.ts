import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulingService } from './scheduling.service.js';
import schedulingConfig from './scheduling.config.js';
import { JobSchedulerPort } from './scheduling.port.js';
import { LoggerModule } from '@platform/nest-infra-logger';
import { SchedulingRepository } from './scheduling.repository.js';
@Module({
  imports: [ConfigModule.forFeature(schedulingConfig), LoggerModule],
  providers: [
    SchedulingService,
    SchedulingRepository,
    {
      provide: JobSchedulerPort,
      useExisting: SchedulingService,
    },
  ],
  exports: [JobSchedulerPort],
})
export class SchedulingModule {}
