import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { DbModule } from 'src/db/db.module';

@Module({
	imports: [DbModule],
	providers: [UserService, UserRepository, DbModule],
	exports: [UserService, UserRepository]
})
export class UserModule {}
