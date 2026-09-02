import { Module } from '@nestjs/common';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';
import { ConfigModule } from '@nestjs/config';
import mailConfig from './mail.config.js';
@Module({
	imports: [ConfigModule.forFeature(mailConfig)],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService]
})
export class MailModule { }
