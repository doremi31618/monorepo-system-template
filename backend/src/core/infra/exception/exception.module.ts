import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { LoggerModule } from '../logger/logger.module.js';

@Module({
    imports: [LoggerModule],
    providers: [{
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
    }],
    exports: [GlobalExceptionFilter],
})
export class ExceptionModule {}
