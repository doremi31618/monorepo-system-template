import { describe, expect, it } from 'bun:test';
import { ExponentialBackoffRetryPolicy } from './retry-policy.js';
import { TaskRunner } from './task-runner.js';
import type {
  ClaimedTask,
  CompleteTaskInput,
  FailTaskInput,
  TaskRecord,
  TaskStore,
} from './task.types.js';

const now = new Date('2026-08-06T00:00:00.000Z');

function task(overrides: Partial<TaskRecord<string>> = {}): TaskRecord<string> {
  return {
    id: 'task-1',
    type: 'send-message',
    payload: 'hello',
    status: 'processing',
    attempt: 1,
    maxAttempts: 3,
    availableAt: now,
    ...overrides,
  };
}

class FakeTaskStore implements TaskStore<string, string> {
  completed: CompleteTaskInput<string>[] = [];
  failed: FailTaskInput[] = [];

  constructor(private claim: ClaimedTask<string> | null) {}

  async claimNext(): Promise<ClaimedTask<string> | null> {
    const claim = this.claim;
    this.claim = null;
    return claim;
  }

  async complete(input: CompleteTaskInput<string>): Promise<boolean> {
    this.completed.push(input);
    return true;
  }

  async fail(input: FailTaskInput): Promise<boolean> {
    this.failed.push(input);
    return true;
  }
}

function claimedTask(record = task()): ClaimedTask<string> {
  return {
    task: record,
    workerId: 'worker-1',
    leaseToken: 'lease-1',
    leaseExpiresAt: new Date(now.getTime() + 30_000),
  };
}

describe('TaskRunner', () => {
  it('claims and completes a task through a registered handler', async () => {
    const store = new FakeTaskStore(claimedTask());
    const runner = new TaskRunner<string, string>({
      store,
      workerId: 'worker-1',
      clock: { now: () => now },
    });
    runner.registerHandler('send-message', async (record) =>
      record.payload.toUpperCase(),
    );

    expect(await runner.runOnce()).toEqual({
      status: 'completed',
      taskId: 'task-1',
    });
    expect(store.completed).toHaveLength(1);
    expect(store.completed[0]?.result).toBe('HELLO');
    expect(store.failed).toHaveLength(0);
  });

  it('fails a task terminally when no handler is registered', async () => {
    const store = new FakeTaskStore(claimedTask());
    const runner = new TaskRunner<string, string>({
      store,
      workerId: 'worker-1',
      clock: { now: () => now },
    });

    expect(await runner.runOnce()).toEqual({
      status: 'failed',
      taskId: 'task-1',
      code: 'handler_not_found',
    });
    expect(store.failed[0]?.failure.retryAt).toBeUndefined();
  });

  it('uses the retry policy to schedule a retry', async () => {
    const store = new FakeTaskStore(claimedTask());
    const runner = new TaskRunner<string, string>({
      store,
      workerId: 'worker-1',
      clock: { now: () => now },
      retryPolicy: new ExponentialBackoffRetryPolicy({
        baseDelayMs: 1_000,
        jitterRatio: 0,
      }),
    });
    runner.registerHandler('send-message', async () => {
      throw new Error('temporary failure');
    });

    expect(await runner.runOnce()).toEqual({
      status: 'retry_scheduled',
      taskId: 'task-1',
      retryAt: new Date('2026-08-06T00:00:01.000Z'),
    });
    expect(store.failed[0]?.failure).toEqual({
      code: 'handler_failed',
      message: 'temporary failure',
      retryAt: new Date('2026-08-06T00:00:01.000Z'),
    });
  });

  it('stops retrying after the maximum attempt', async () => {
    const store = new FakeTaskStore(claimedTask(task({ attempt: 3 })));
    const runner = new TaskRunner<string, string>({
      store,
      workerId: 'worker-1',
      clock: { now: () => now },
    });
    runner.registerHandler('send-message', async () => {
      throw new Error('permanent failure');
    });

    expect(await runner.runOnce()).toEqual({
      status: 'failed',
      taskId: 'task-1',
      code: 'attempts_exhausted',
    });
    expect(store.failed[0]?.failure.retryAt).toBeUndefined();
  });
});
