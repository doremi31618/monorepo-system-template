import { httpClient } from '../utils';
import {type Session} from '@share/contract';


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

export async function requestPasswordReset(email: string) {
    return await httpClient.post<{ token: string; expiresAt: string; resetLink: string }>('/auth/reset/request', { email });
}

export async function confirmPasswordReset(token: string, password: string) {
    return await httpClient.post<{ userId: number; redirect?: string }>('/auth/reset/confirm', { token, password });
}
