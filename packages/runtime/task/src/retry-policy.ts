import type { RetryPolicy } from './task.types.js';

export interface ExponentialBackoffOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
}

export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly jitterRatio: number;
  private readonly random: () => number;

  constructor(options: ExponentialBackoffOptions = {}) {
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
    this.maxDelayMs = options.maxDelayMs ?? 60_000;
    this.jitterRatio = options.jitterRatio ?? 0.2;
    this.random = options.random ?? Math.random;

    if (this.baseDelayMs < 0 || this.maxDelayMs < this.baseDelayMs) {
      throw new Error('Invalid retry delay range');
    }
    if (this.jitterRatio < 0 || this.jitterRatio > 1) {
      throw new Error('jitterRatio must be between 0 and 1');
    }
  }

  nextDelayMs({
    task,
  }: Parameters<RetryPolicy['nextDelayMs']>[0]): number | null {
    if (task.attempt >= task.maxAttempts) {
      return null;
    }

    const exponentialDelay = Math.min(
      this.maxDelayMs,
      this.baseDelayMs * 2 ** Math.max(0, task.attempt - 1),
    );
    const jitter = exponentialDelay * this.jitterRatio * this.random();
    return Math.round(exponentialDelay + jitter);
  }
}
