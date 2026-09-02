import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import loggerConfig from './logger.config.js';
import { LoggerService } from './logger.service.js';

@Module({
  imports: [ConfigModule.forFeature(loggerConfig)],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
