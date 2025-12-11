import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './core/core.module';
import appConfig from './core/infra/config/app.config';
@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
		CoreModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule { }
