export type UserIdentity = {
    name: string;
    userId: number;
};
export type Session = {
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
} & UserIdentity;
export declare class UserIdentityDto {
    constructor(token: string, refreshToken: string, userId: number, name: string);
    token: string;
    refreshToken: string;
    userId: number;
    name: string;
}
export declare class SessionDto implements Session {
    token: string;
    userId: number;
    name: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class SignoutDto {
    userId: number;
}
export declare class SignupDto {
    email: string;
    password: string;
    name: string;
}
export declare class ResetRequestDto {
    email: string;
}
export declare class ResetConfirmDto {
    token: string;
    password: string;
}
export declare class ResetResponseDto {
    token: string;
    expiresAt: Date;
    resetLink: string;
}
export declare class LoginResponseDto {
    userId: number;
    redirect: string;
}
//# sourceMappingURL=user.d.ts.map