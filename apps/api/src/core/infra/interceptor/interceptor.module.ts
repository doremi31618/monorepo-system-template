import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@platform/nest-infra-logger';
import { LoggingInterceptor } from './logging.interceptor.js';
import { ResponseInterceptor } from './response.interceptor.js';
@Module({
    imports: [LoggerModule],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        }
    ],
    exports: []
})
export class InterceptorModule {}
