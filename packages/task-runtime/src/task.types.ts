export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskRecord<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  status: TaskStatus;
  attempt: number;
  maxAttempts: number;
  availableAt: Date;
  partitionKey?: string;
  dedupeKey?: string;
}

export interface ClaimedTask<TPayload = unknown> {
  task: TaskRecord<TPayload>;
  workerId: string;
  leaseToken: string;
  leaseExpiresAt: Date;
}

export interface ClaimTaskOptions {
  workerId: string;
  now: Date;
  leaseDurationMs: number;
}

export interface CompleteTaskInput<TResult = unknown> {
  taskId: string;
  workerId: string;
  leaseToken: string;
  completedAt: Date;
  result?: TResult;
}

export interface TaskFailure {
  code: string;
  message: string;
  retryAt?: Date;
}

export interface FailTaskInput {
  taskId: string;
  workerId: string;
  leaseToken: string;
  failedAt: Date;
  failure: TaskFailure;
}

export interface TaskStore<TPayload = unknown, TResult = unknown> {
  claimNext(options: ClaimTaskOptions): Promise<ClaimedTask<TPayload> | null>;
  complete(input: CompleteTaskInput<TResult>): Promise<boolean>;
  fail(input: FailTaskInput): Promise<boolean>;
}

export type TaskHandler<TPayload = unknown, TResult = unknown> = (
  task: TaskRecord<TPayload>,
) => Promise<TResult>;

export interface TaskRuntimeLogger {
  debug?(message: string, context?: Record<string, unknown>): void;
  error?(message: string, context?: Record<string, unknown>): void;
}

export interface Clock {
  now(): Date;
}

export interface RetryContext<TPayload = unknown> {
  error: unknown;
  task: TaskRecord<TPayload>;
}

export interface RetryPolicy<TPayload = unknown> {
  nextDelayMs(context: RetryContext<TPayload>): number | null;
}
