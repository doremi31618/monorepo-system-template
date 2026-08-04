import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { IUserService } from './user.interface.js';

@Module({
	providers: [
		UserService, 
		UserRepository, 
		{
			provide: IUserService,
			useClass: UserService,
		}],
	exports: [UserService, UserRepository, IUserService]
})
export class UserModule { }
