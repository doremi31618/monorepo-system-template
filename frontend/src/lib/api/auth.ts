import { httpClient } from './httpClient';

export type UserBasicInfo = {
    userId: number;
    name: string;
}

export type Session = UserBasicInfo & {
    token: string;
}

export async function InspectSession(){
    return await httpClient.get<Session>('/auth/inspect');
}

export async function login(email: string, password: string) {
    return await httpClient.post<Session>('/auth/login', { email, password });
    
}

export async function register(name: string, email: string, password: string) {
    return await httpClient.post<Session>('/auth/signup', { name, email, password });
}

export async function logout(){
    return await httpClient.post<{userId: number}>('/auth/signout', {});
}

export async function refresh(){
    return await httpClient.post<Session>('/auth/refresh', {});
}