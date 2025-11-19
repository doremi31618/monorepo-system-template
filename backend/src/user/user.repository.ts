import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type DB } from 'src/db/db';
import { schema } from 'src/db/schema';

export type ReturnUser = {
	id: number;
	email: string;
	name: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateUser = {
	email: string;
	name: string;
	password: string;
};

@Injectable()
export class UserRepository {
	constructor(@Inject('DB') private readonly db: DB) {}

	async getUserByEmail(email: string): Promise<ReturnUser | null> {
		const user = await this.db
			.select({
				id: schema.userModel.users.id,
				email: schema.userModel.users.email,
				name: schema.userModel.users.name,
				password: schema.userModel.users.password,
				createdAt: schema.userModel.users.createdAt,
				updatedAt: schema.userModel.users.updatedAt
			})
			.from(schema.userModel.users)
			.where(eq(schema.userModel.users.email, email));

		return user[0] ?? null;
	}

	async createUser(user: CreateUser): Promise<ReturnUser> {
		const [newUser] = await this.db
			.insert(schema.userModel.users)
			.values({
				email: user.email,
				name: user.name,
				password: user.password
			})
			.returning({
				id: schema.userModel.users.id,
				email: schema.userModel.users.email,
				name: schema.userModel.users.name,
				password: schema.userModel.users.password,
				createdAt: schema.userModel.users.createdAt,
				updatedAt: schema.userModel.users.updatedAt
			});
		return newUser;
	}
}
