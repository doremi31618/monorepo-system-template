import {
	IsEmail,
	IsNotEmpty,
	IsString,
	IsNumber,
	IsDate
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
	@ApiProperty({ example: 1 })
	@IsNumber()
	@IsNotEmpty()
	userId: number;

	@ApiProperty({ example: 'session-token-uuid' })
	@IsString()
	@IsNotEmpty()
	sessionToken: string;

	@ApiProperty({ example: new Date().toISOString() })
	@IsDate()
	@IsNotEmpty()
	expiresAt: Date;

	@ApiProperty({ example: new Date().toISOString() })
	@IsDate()
	@IsNotEmpty()
	createdAt: Date;

	@ApiProperty({ example: new Date().toISOString() })
	@IsDate()
	@IsNotEmpty()
	updatedAt: Date;
}
export class SignoutDto {
	@ApiProperty({ example: 1 })
	@IsNumber()
	@IsNotEmpty()
	userId: number;
}

export class CredentialsDto {
	@ApiProperty({ example: 'session-token-uuid' })
	@IsString()
	@IsNotEmpty()
	sessionToken: string;

	@ApiProperty({ example: 'refresh-token-uuid' })
	@IsString()
	@IsNotEmpty()
	refreshToken: string;
}

export class UserIdentityDto {
	constructor(
		token: string,
		refreshToken: string,
		userId: number,
		name: string
	) {
		this.token = token;
		this.refreshToken = refreshToken;
		this.userId = userId;
		this.name = name;
	}

	@ApiProperty({ example: 'session-token-uuid' })
	@IsString()
	@IsNotEmpty()
	token: string;

	@ApiProperty({ example: 'refresh-token-uuid' })
	@IsString()
	@IsNotEmpty()
	refreshToken: string;

	@ApiProperty({ example: 1 })
	@IsNumber()
	@IsNotEmpty()
	userId: number;

	@ApiProperty({ example: 'Jane Doe' })
	@IsString()
	@IsNotEmpty()
	name: string;
}

export class SignupDto {
	@ApiProperty({ example: 'jane@example.com' })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: 'S3cretPass!' })
	@IsString()
	@IsNotEmpty()
	password: string;

	@ApiProperty({ example: 'Jane Doe' })
	@IsString()
	@IsNotEmpty()
	name: string;
}

export class LoginDto {
	@ApiProperty({ example: 'jane@example.com' })
	@IsEmail()
	@IsNotEmpty()
	email!: string;

	@ApiProperty({ example: 'S3cretPass!' })
	@IsString()
	@IsNotEmpty()
	password!: string;
}
