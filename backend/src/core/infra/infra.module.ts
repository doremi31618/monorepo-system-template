import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module.js';
import { MailModule } from './mail/mail.module.js';

@Module({
    imports: [DbModule, MailModule],
    exports: [DbModule, MailModule]
})
export class InfraModule { }
