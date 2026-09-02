import { registerAs } from '@nestjs/config';
import { hostname } from 'node:os';

export type SchedulingConfig = {
  workerId: string;
};

export default registerAs('scheduling', (): SchedulingConfig => ({
  workerId:
    process.env.WORKER_ID ??
    `${hostname()}-${Math.random().toString(36).substring(2, 9)}`,
}));
