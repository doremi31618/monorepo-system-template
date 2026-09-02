import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import type {
  LoginRedirectResult,
  LoginRequest,
  PasswordResetConfirmation,
  PasswordResetRequest,
  PasswordResetResult,
  Session,
  SignupRequest,
} from '@platform/types-identity';

export class UserIdentityDto {
  constructor(
    token: string,
    refreshToken: string,
    userId: number,
    name: string,
  ) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.name = name;
  }

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SessionDto implements Session {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDate()
  @IsNotEmpty()
  expiresAt!: Date;

  @IsDate()
  @IsNotEmpty()
  createdAt!: Date;

  @IsDate()
  @IsNotEmpty()
  updatedAt!: Date;
}

export class LoginDto implements LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SignoutDto {
  @IsNumber()
  @IsNotEmpty()
  userId!: number;
}

export class SignupDto implements SignupRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class ResetRequestDto implements PasswordResetRequest {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetConfirmDto implements PasswordResetConfirmation {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ResetResponseDto implements PasswordResetResult {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsDate()
  @IsNotEmpty()
  expiresAt!: Date;

  @IsString()
  @IsNotEmpty()
  resetLink!: string;
}

export class LoginResponseDto implements LoginRedirectResult {
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  redirect!: string;
}
