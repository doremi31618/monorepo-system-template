
export interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
}

export interface Permission {
    id: string;
    module: string;
    action: string;
    description: string;
}

export interface UserWithRoles {
    id: number;
    email: string;
    name: string;
    userRoles: {
        role: Role;
    }[];
}
