import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { DbModule } from 'src/core/infra/db/db.module';

@Module({
	imports: [DbModule],
	controllers: [MailController],
	providers: [MailService],
	exports: [MailService]
})
export class MailModule { }
