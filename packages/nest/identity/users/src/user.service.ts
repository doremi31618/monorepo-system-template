import { type CreateUserInput } from '@platform/types-identity';
import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import type { IUserService } from './user.interface.js';

@Injectable()
export class UserService implements IUserService {
	constructor(private readonly userRepository: UserRepository) { }

	async createUser(user: CreateUserInput) {
		return this.userRepository.createUser(user);
	}

	async getUserById(id: number) {
		return this.userRepository.getUserById(id);
	}

	async getUserByEmail(email: string) {
		return this.userRepository.getUserByEmail(email);
	}

	async updateUser(id: number, data: Partial<CreateUserInput>) {
		return this.userRepository.updateUser(id, data);
	}

	async updatePassword(userId: number, newPassword: string) {
		return this.userRepository.updatePassword(userId, newPassword);
	}
}
