import { httpClient } from './httpClient';

export async function login(email: string, password: string) {
    return httpClient.post('/auth/login', { email, password });
}

export async function signup(name: string, email: string, password: string) {
    return httpClient.post('/auth/register', { name, email, password });
}