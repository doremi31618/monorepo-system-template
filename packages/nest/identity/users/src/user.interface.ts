
import { type CreateUserInput } from '@platform/types-identity';

export class UserEntity {
    id: number;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export abstract class IUserService {
    abstract getUserById(id: number): Promise<UserEntity | null>;
    abstract getUserByEmail(email: string): Promise<UserEntity | null>;
    // getUserIdByToken(token: string): Promise<{ id: number }>;
    abstract createUser(user: CreateUserInput): Promise<UserEntity>;
    abstract updatePassword(userId: number, newPassword: string): Promise<{ id: number }>;
}
