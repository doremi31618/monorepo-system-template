import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type DB } from '../../infra/db/db.js';
import { schema } from '../../infra/db/schema.js';

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
	constructor(@Inject('DB') private readonly db: DB) { }

	async getUserByEmail(email: string): Promise<ReturnUser | null> {
		const user = await this.db
			.select({
				id: schema.users.id,
				email: schema.users.email,
				name: schema.users.name,
				password: schema.users.password,
				createdAt: schema.users.createdAt,
				updatedAt: schema.users.updatedAt
			})
			.from(schema.users)
			.where(eq(schema.users.email, email));

		return user[0] ?? null;
	}

	async createUser(user: CreateUser): Promise<ReturnUser> {
		const [newUser] = await this.db
			.insert(schema.users)
			.values({
				email: user.email,
				name: user.name,
				password: user.password
			})
			.returning({
				id: schema.users.id,
				email: schema.users.email,
				name: schema.users.name,
				password: schema.users.password,
				createdAt: schema.users.createdAt,
				updatedAt: schema.users.updatedAt
			});
		return newUser;
	}

	async updatePassword(userId: number, hashedPassword: string) {
		const [updated] = await this.db
			.update(schema.users)
			.set({
				password: hashedPassword,
				updatedAt: new Date()
			})
			.where(eq(schema.users.id, userId))
			.returning({
				id: schema.users.id
			});
		return updated ?? null;
	}
}
