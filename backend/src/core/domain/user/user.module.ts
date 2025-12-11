import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { DbModule } from '../../infra/db/db.module.js';

@Module({
	imports: [DbModule],
	providers: [UserService, UserRepository, DbModule],
	exports: [UserService, UserRepository]
})
export class UserModule { }
