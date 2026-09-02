export interface UserIdentity {
  name: string;
  userId: number;
}

export interface Session extends UserIdentity {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  token: string;
  password: string;
}

export interface PasswordResetResult {
  token: string;
  expiresAt: Date;
  resetLink: string;
}

export interface LoginRedirectResult {
  userId: number;
  redirect: string;
}
