import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { AppConfig } from '$lib/config';
import * as authAPI from '$lib/api/auth'
import { appRoutePath } from '$lib/config/route';
export type UserIdentity = {
    id: string;
    email: string;
    name: string;
}


export type AuthStore = {subscribe: Writable<authAPI.UserBasicInfo | null>['subscribe']} & {
    register: (username: string, email: string, password: string) => Promise<authAPI.Session>;
    getToken: () => Promise<authAPI.Session | null>;
    login: (email: string, password: string) => Promise<authAPI.Session>;
    logout: () => Promise<{userId: number}>;
    InspectSession: () => Promise<authAPI.Session>;
    isAuthenticated: () => Promise<boolean>;
}
const STORAGE_KEY = AppConfig.sessionStorageKey;

function readFromStorage(): authAPI.Session | null{
    if (!browser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try{
        const parsed = JSON.parse(raw) as authAPI.Session | string;
        if (typeof parsed === 'string'){
            return {
                userId: 0,
                name: '',
                token: parsed
            };
        }
        return parsed;
    } catch (error) {
        console.error('Failed to parse session from storage', error);
        // legacy string format fallback
        return null;
    }
}

function writeToStorage(session: authAPI.Session | null){
    if (!browser) return;
    if (session){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else if (localStorage.getItem(STORAGE_KEY)){
        localStorage.removeItem(STORAGE_KEY);
    }
}

function removeFromStorage(){
    if (!browser) return;
    if (localStorage.getItem(STORAGE_KEY))localStorage.removeItem(STORAGE_KEY);
}


function createAuthStore(): AuthStore {
    const initialSession = readFromStorage();
    const {subscribe, set } = writable<authAPI.Session | null>(initialSession)

    return {
        subscribe,
        async getToken(){
            return readFromStorage();
        },
        async isAuthenticated(){
            return readFromStorage() !== null;
        },
        async InspectSession(){
            const response = await authAPI.InspectSession();
            if (response.statusCode !== 200){
                goto(appRoutePath.user.home);
            }
            return response.data as authAPI.Session;
        },
        async register (_username: string, email: string, _password: string){
            const response = await authAPI.register(_username, email, _password);
            const session = (response.data ?? null) as authAPI.Session | null;
            if (!session) {
                throw new Error('Failed to create session during registration');
            }
            set({
                userId: session.userId,
                name: session.name,
                token: session.token
            });
            writeToStorage(session);

            if (response.statusCode == 200){
                await goto(appRoutePath.user.home);
            }
            return response.data as authAPI.Session;
        },
        async login (_email: string, _password: string){
            //api: api/auth/login
            const response = await authAPI.login(_email, _password);
            const session = (response.data ?? null) as authAPI.Session | null;
            if (!session) {
                throw new Error('Failed to retrieve session during login');
            }
            set({
                userId: session.userId,
                name: session.name,
                token: session.token
            });
            writeToStorage(session);
            console.info('login response', response, appRoutePath.user.home);
            if (response.statusCode == 200){
                console.info('redirecting to home');
                await goto(appRoutePath.user.home);
            }
            return response.data as authAPI.Session;
        },
        async logout () {
            // api: api/auth/logout
            const response = await authAPI.logout();
            removeFromStorage();
            set(null);
            if (response.statusCode == 200){
                await goto( resolve(appRoutePath.base) );
            }
            return { userId: 0 };
        },
    } 
}

export const authStore = createAuthStore();
