import { registerAs } from '@nestjs/config';

export type LoggerConfig = {
  pretty: boolean;
};

export default registerAs('logger', (): LoggerConfig => ({
  pretty: process.env.NODE_ENV !== 'prd',
}));
