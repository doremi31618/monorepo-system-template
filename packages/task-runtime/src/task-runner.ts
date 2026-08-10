import { ExponentialBackoffRetryPolicy } from './retry-policy.js';
import type {
  ClaimedTask,
  Clock,
  RetryPolicy,
  TaskHandler,
  TaskRecord,
  TaskRuntimeLogger,
  TaskStore,
} from './task.types.js';

export type TaskRunResult =
  | { status: 'idle' }
  | { status: 'completed'; taskId: string }
  | { status: 'retry_scheduled'; taskId: string; retryAt: Date }
  | { status: 'failed'; taskId: string; code: string };

export interface TaskRunnerOptions<TPayload = unknown, TResult = unknown> {
  store: TaskStore<TPayload, TResult>;
  workerId: string;
  leaseDurationMs?: number;
  retryPolicy?: RetryPolicy<TPayload>;
  clock?: Clock;
  logger?: TaskRuntimeLogger;
}

const systemClock: Clock = {
  now: () => new Date(),
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class TaskRunner<TPayload = unknown, TResult = unknown> {
  private readonly handlers = new Map<string, TaskHandler<TPayload, TResult>>();
  private readonly leaseDurationMs: number;
  private readonly retryPolicy: RetryPolicy<TPayload>;
  private readonly clock: Clock;

  constructor(private readonly options: TaskRunnerOptions<TPayload, TResult>) {
    this.leaseDurationMs = options.leaseDurationMs ?? 30_000;
    this.retryPolicy =
      options.retryPolicy ?? new ExponentialBackoffRetryPolicy();
    this.clock = options.clock ?? systemClock;

    if (this.leaseDurationMs <= 0) {
      throw new Error('leaseDurationMs must be greater than zero');
    }
  }

  registerHandler(
    type: string,
    handler: TaskHandler<TPayload, TResult>,
  ): () => void {
    if (this.handlers.has(type)) {
      throw new Error(`A handler is already registered for task type: ${type}`);
    }

    this.handlers.set(type, handler);
    return () => {
      if (this.handlers.get(type) === handler) {
        this.handlers.delete(type);
      }
    };
  }

  async runOnce(): Promise<TaskRunResult> {
    const claim = await this.options.store.claimNext({
      workerId: this.options.workerId,
      now: this.clock.now(),
      leaseDurationMs: this.leaseDurationMs,
    });

    if (!claim) {
      return { status: 'idle' };
    }

    const handler = this.handlers.get(claim.task.type);
    if (!handler) {
      const code = 'handler_not_found';
      await this.options.store.fail({
        taskId: claim.task.id,
        workerId: claim.workerId,
        leaseToken: claim.leaseToken,
        failedAt: this.clock.now(),
        failure: {
          code,
          message: `No handler registered for task type: ${claim.task.type}`,
        },
      });
      return { status: 'failed', taskId: claim.task.id, code };
    }

    try {
      const result = await handler(claim.task);
      await this.options.store.complete({
        taskId: claim.task.id,
        workerId: claim.workerId,
        leaseToken: claim.leaseToken,
        completedAt: this.clock.now(),
        result,
      });
      return { status: 'completed', taskId: claim.task.id };
    } catch (error) {
      return this.handleFailure(claim.task, claim, error);
    }
  }

  private async handleFailure(
    task: TaskRecord<TPayload>,
    claim: ClaimedTask<TPayload>,
    error: unknown,
  ): Promise<TaskRunResult> {
    const delayMs = this.retryPolicy.nextDelayMs({ error, task });
    const failedAt = this.clock.now();
    const retryAt =
      delayMs === null ? undefined : new Date(failedAt.getTime() + delayMs);
    const code = delayMs === null ? 'attempts_exhausted' : 'handler_failed';

    await this.options.store.fail({
      taskId: task.id,
      workerId: claim.workerId,
      leaseToken: claim.leaseToken,
      failedAt,
      failure: {
        code,
        message: errorMessage(error),
        retryAt,
      },
    });

    this.options.logger?.error?.('Task handler failed', {
      taskId: task.id,
      taskType: task.type,
      attempt: task.attempt,
      retryAt: retryAt?.toISOString(),
      error: errorMessage(error),
    });

    return retryAt
      ? { status: 'retry_scheduled', taskId: task.id, retryAt }
      : { status: 'failed', taskId: task.id, code };
  }
}
