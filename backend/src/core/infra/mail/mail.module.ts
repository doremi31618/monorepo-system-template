import { Module } from '@nestjs/common';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
	imports: [DbModule],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService]
})
export class MailModule { }
