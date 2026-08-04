import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsDate,
    IsEmail
} from 'class-validator'


export type UserIdentity = {
    name: string
    userId: number
}



export type Session = {
    token: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
} & UserIdentity

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

export class LoginDto {
    @IsString()
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

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;
}

export class ResetRequestDto {
    @IsString()
    @IsNotEmpty()
    email!: string;
}

export class ResetConfirmDto {
    @IsString()
    @IsNotEmpty()
    token!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}



export class ResetResponseDto {
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

export class LoginResponseDto {
    @IsNumber()
    @IsNotEmpty()
    userId!: number;

    @IsString()
    @IsNotEmpty()
    redirect!: string;
}

export class CreateUserDto {
    
    @IsEmail()
    @IsNotEmpty()
    email!: string;
    
    @IsString()
    @IsNotEmpty()
    name!: string;
    
    @IsString()
    @IsNotEmpty()
    password!: string;
}
