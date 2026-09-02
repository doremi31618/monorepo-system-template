// import { Injectable } from '@nestjs/common';
import {
  ConsoleLogger,
  Injectable,
  Scope,
  Inject,
  type LogLevel,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import loggerConfig from './logger.config.js';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(
    @Inject(loggerConfig.KEY) private config: ConfigType<typeof loggerConfig>,
    context?: string,
  ) {
    super(context ?? LoggerService.name);
  }

  protected override formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMesssage: string,
    formattedMessage: string,
    contextMessage: string,
    nextContextMessage: string,
  ): string {
    if (this.config.pretty) {
      return super.formatMessage(
        logLevel,
        message,
        pidMesssage,
        formattedMessage,
        contextMessage,
        nextContextMessage,
      );
    }

    return JSON.stringify({
      logLevel,
      message,
      pidMesssage,
      formattedMessage,
      contextMessage,
      nextContextMessage,
    });
  }
}
