import { Injectable } from '@nestjs/common';
import { UserRepository, type CreateUser } from './user.repository';

@Injectable()
export class UserService {
	constructor(private readonly userRepository: UserRepository) {}

	async createUser(user: CreateUser) {
		return this.userRepository.createUser(user);
	}

	async getUserByEmail(email: string) {
		return this.userRepository.getUserByEmail(email);
	}
}
