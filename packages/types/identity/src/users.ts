export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
