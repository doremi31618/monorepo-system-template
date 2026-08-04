import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { MailModule } from '@platform/mail';
import { LoggerModule } from '@platform/logger';
import { ExceptionModule } from './exception/exception.module.js';
import { InterceptorModule } from './interceptor/interceptor.module.js';
import { SchedulingModule } from '@platform/scheduling';

@Module({
    imports: [DbModule, MailModule, LoggerModule, ExceptionModule, InterceptorModule, SchedulingModule],
    exports: [DbModule, MailModule, LoggerModule]
})
export class InfraModule { }
