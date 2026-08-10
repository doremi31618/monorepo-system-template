import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JobSchedulerPort, Job, JobStatus } from './scheduling.port.js';
import { SchedulingRepository } from './scheduling.repository.js';
import { LoggerService } from '@platform/logger';
import { appConfig } from '@platform/config';

@Injectable()
export class SchedulingService
  implements JobSchedulerPort, OnModuleInit, OnModuleDestroy
{
  private readonly JobHandler = new Map<
    string,
    (job: Job) => Promise<unknown>
  >();
  private readonly workerId: string;
  private readonly inspectInterval = 1000;
  private readonly inspectIntervalWhenNoJob = 3000;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(
    private readonly repository: SchedulingRepository,
    private readonly logger: LoggerService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    this.logger.setContext(SchedulingService.name);
    this.workerId = this.config.workerId;
  }
  onModuleInit() {
    this.logger.log(`Starting Worker ${this.workerId}`);
    this.schedulePoll(0);
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  async schedule(name: string, data: unknown, runAt: Date): Promise<void> {
    this.logger.log(`Scheduling ${name} at ${runAt}`);
    await this.repository.createJob({
      name,
      data,
      runAt,
    });
  }
  registerHandler(name: string, handler: (job: Job) => Promise<unknown>): void {
    if (this.JobHandler.has(name)) {
      throw new Error(`A handler is already registered for job: ${name}`);
    }
    this.JobHandler.set(name, handler);
  }

  private schedulePoll(delay: number) {
    if (this.stopped) {
      return;
    }
    this.pollTimer = setTimeout(() => {
      void this.poll();
    }, delay);
  }

  private async poll() {
    let inspectInterval = this.inspectInterval;

    try {
      // get pending jobs
      const pendingJobs = await this.repository.getPendingJobs();
      if (pendingJobs.length === 0) {
        inspectInterval = this.inspectIntervalWhenNoJob; // no job to process, wait for 3 seconds
        return;
      }

      // lock next job
      const job = await this.repository.lockNextJob(
        pendingJobs[0].id,
        this.workerId,
      );
      if (job.length === 0) {
        inspectInterval = this.inspectIntervalWhenNoJob; // no job to process, wait for 3 seconds
        return;
      }

      // get job handler
      const jobName = job[0].name;
      this.logger.log(`Processing ${jobName} at ${job[0].runAt}`);
      if (!this.JobHandler.has(jobName)) {
        this.logger.error(`No handler for ${jobName}`);
        await this.repository.updateJobStatus(
          jobName,
          job[0].runAt,
          JobStatus.FAILED,
        );
        return;
      }

      // execute job handler
      try {
        const handler = this.JobHandler.get(jobName);
        if (handler) {
          await handler(job[0] as Job);
        }

        // update job status
        await this.repository.updateJobStatus(
          jobName,
          job[0].runAt,
          JobStatus.COMPLETED,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process ${jobName} at ${job[0].runAt}`,
          error,
        );
        await this.repository.updateJobStatus(
          jobName,
          job[0].runAt,
          JobStatus.FAILED,
        );
      }
    } catch (error) {
      this.logger.error('Polling Error', error);
    } finally {
      this.schedulePoll(inspectInterval);
    }
  }
}
