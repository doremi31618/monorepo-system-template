import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { RepositoryModule } from './repository/repository.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import appConfig from './config/app.config';
@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
		DbModule,
		AuthModule,
		RepositoryModule,
		UserModule,
		MailModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
