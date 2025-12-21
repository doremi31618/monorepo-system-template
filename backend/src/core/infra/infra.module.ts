import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { MailModule } from './mail/mail.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { ExceptionModule } from './exception/exception.module.js';
import { InterceptorModule } from './interceptor/interceptor.module.js';

@Module({
    imports: [DbModule, MailModule, LoggerModule, ExceptionModule, InterceptorModule],
    exports: [DbModule, MailModule, LoggerModule]
})
export class InfraModule { }
