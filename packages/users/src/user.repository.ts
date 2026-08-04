import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
// import { type DB } from '../../infra/db/db.js';
import { users } from './user.schema.js';
import { type UserEntity } from './user.interface.js';
import { type CreateUserDto } from '@platform/contracts';
import { BaseRepository } from '@platform/database';
// import { type User, type NewUser } from './user.schema.js';


@Injectable()
export class UserRepository extends BaseRepository {
	// constructor(@Inject('DB') private readonly db: DB) { }
	async getUserById(id: number): Promise<UserEntity | null> {
		const user = await this.db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				password: users.password,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt
			})
			.from(users)
			.where(eq(users.id, id));
		return user[0] ?? null;
	}
	async getUserByEmail(email: string): Promise<UserEntity | null> {
		const user = await this.db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				password: users.password,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt
			})
			.from(users)
			.where(eq(users.email, email));

		return user[0] ?? null;
	}

	async createUser(user: CreateUserDto): Promise<UserEntity> {
		const [newUser] = await this.db
			.insert(users)
			.values({
				email: user.email,
				name: user.name,
				password: user.password
			})
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
				password: users.password,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt
			});
		return newUser;
	}

	async updatePassword(userId: number, hashedPassword: string) {
		const [updated] = await this.db
			.update(users)
			.set({
				password: hashedPassword,
				updatedAt: new Date()
			})
			.where(eq(users.id, userId))
			.returning({
				id: users.id
			});
		return updated ?? null;
	}
	async updateUser(id: number, data: Partial<CreateUserDto>) {
		return this.db.update(users).set(data).where(eq(users.id, id)).returning();
	}
}
