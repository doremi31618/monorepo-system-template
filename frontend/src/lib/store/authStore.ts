import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { AppConfig } from '$lib/config';
import * as authAPI from '$lib/api/auth';
import { appRoutePath } from '$lib/config/route';
import type { ApiResponse } from '$lib/api/httpClient';
export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export type AuthState = {
    session: authAPI.Session | null;
    status: AuthStatus;
    message: string | null;
};

export type AuthResult = {
    session: authAPI.Session | null;
    status: number;
    message: string;
    error?: string | null;
};

export type AuthStore = { subscribe: Writable<AuthState>['subscribe'] } & {
    register: (username: string, email: string, password: string) => Promise<AuthResult>;
    getToken: () => Promise<authAPI.Session | null>;
    login: (email: string, password: string) => Promise<AuthResult>;
    logout: () => Promise<AuthResult>;
    InspectSession: () => Promise<AuthResult>;
    isAuthenticated: () => Promise<boolean>;
    refreshSession: () => Promise<AuthResult>;
    setSession: (session: authAPI.Session | null, message?: string | null, status?: AuthStatus) => void;
    clearSession: (message?: string | null, status?: AuthStatus) => void;
};

const STORAGE_KEY = AppConfig.sessionStorageKey;

function readFromStorage(): authAPI.Session | null {
    if (!browser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as authAPI.Session | string;
        if (typeof parsed === 'string') {
            return {
                userId: 0,
                name: '',
                token: parsed,
            };
        }
        return parsed;
    } catch (error) {
        console.error('Failed to parse session from storage', error);
        return null;
    }
}

function writeToStorage(session: authAPI.Session | null) {
    if (!browser) return;
    if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function createAuthStore(): AuthStore {
    const initialSession = readFromStorage();
    const { subscribe, set, update } = writable<AuthState>({
        session: initialSession,
        status: 'idle',
        message: null,
    });

    const setSession = (session: authAPI.Session | null, message: string | null = null, status: AuthStatus = message ? 'success' : 'idle') => {
        set({ session, status, message });
        writeToStorage(session);
    };

    const clearSession = (message: string | null = null, status: AuthStatus = 'idle') => {
        set({ session: null, status, message });
        writeToStorage(null);
    };

    const formatResult = (response: ApiResponse<authAPI.Session | { session?: authAPI.Session | null }> | AuthResult): AuthResult => {
        if ('statusCode' in response) {
            const session = (response.data as authAPI.Session | null) ?? (response.data as { session?: authAPI.Session | null })?.session ?? null;
            return {
                session,
                status: response.statusCode,
                message: response.message,
                error: response.error,
            };
        }
        return response;
    };

    return {
        subscribe,
        setSession,
        clearSession,
        async refreshSession() {
            update((state) => ({ ...state, status: 'loading', message: null }));
            try {
                const response = await authAPI.refresh() as ApiResponse<authAPI.Session>;
                setSession(response.data ?? null, response.message);
                return formatResult(response);
            } catch (error) {
                clearSession('Failed to refresh session', 'error');
                const fallback: AuthResult = {
                    session: null,
                    status: (error as ApiResponse<unknown>)?.statusCode ?? 500,
                    message: (error as ApiResponse<unknown>)?.message ?? 'Failed to refresh session',
                    error: (error as ApiResponse<unknown>)?.error ?? null,
                };
                return fallback;
            }
        },
        async getToken() {
            return readFromStorage();
        },
        async isAuthenticated() {
            return readFromStorage() !== null;
        },
        async InspectSession() {
            update((state) => ({ ...state, status: 'loading', message: null }));
            try {
                const response = await authAPI.InspectSession();
                if (response.statusCode !== 200) {
                    throw {
                        error: 'Failed to inspect session',
                        statusCode: response.statusCode,
                        message: response.message,
                    };
                }
                const session = (response.data ?? null) as authAPI.Session | null;
                setSession(session, response.message);
                return formatResult(response);
            } catch (error) {
                clearSession('Session invalid', 'error');
                const fallback: AuthResult = {
                    session: null,
                    status: (error as ApiResponse<unknown>)?.statusCode ?? 401,
                    message: (error as ApiResponse<unknown>)?.message ?? 'Failed to inspect session',
                    error: (error as ApiResponse<unknown>)?.error ?? null,
                };
                return fallback;
            }
        },
        async register(username: string, email: string, password: string) {
            update((state) => ({ ...state, status: 'loading', message: null }));
            try {
                const response = await authAPI.register(username, email, password);
                const session = (response.data ?? null) as authAPI.Session | null;
                if (!session) {
                    throw {
                        error: 'Failed to create session during registration',
                        statusCode: response.statusCode,
                        message: response.message,
                    };
                }
                setSession(session, response.message);
                if (browser && response.statusCode === 200) {
                    await goto(appRoutePath.user.home);
                }
                return formatResult(response);
            } catch (error) {
                clearSession((error as ApiResponse<unknown>)?.message ?? 'Registration failed', 'error');
                const fallback: AuthResult = {
                    session: null,
                    status: (error as ApiResponse<unknown>)?.statusCode ?? 500,
                    message: (error as ApiResponse<unknown>)?.message ?? 'Registration failed',
                    error: (error as ApiResponse<unknown>)?.error ?? null,
                };
                return fallback;
            }
        },
        async login(email: string, password: string) {
            update((state) => ({ ...state, status: 'loading', message: null }));
            try {
                const response = await authAPI.login(email, password);
                const session = (response.data ?? null) as authAPI.Session | null;
                if (!session) {
                    throw {
                        error: 'Failed to retrieve session during login',
                        statusCode: response.statusCode,
                        message: response.message,
                    } as ApiResponse<authAPI.Session>;
                }
                setSession(session, response.message);
                if (browser && response.statusCode === 200) {
                    await goto(appRoutePath.user.home);
                }
                return formatResult(response);
            } catch (error) {
                clearSession((error as ApiResponse<unknown>)?.message ?? 'Login failed', 'error');
                const fallback: AuthResult = {
                    session: null,
                    status: (error as ApiResponse<unknown>)?.statusCode ?? 500,
                    message: (error as ApiResponse<unknown>)?.message ?? 'Login failed',
                    error: (error as ApiResponse<unknown>)?.error ?? null,
                };
                return fallback;
            }
        },
        async logout() {
            set((state) => ({ ...state, status: 'loading', message: null }));
            try {
                const response = await authAPI.logout();
                if (response.statusCode !== 200) {
                    throw {
                        error: 'Failed to logout',
                        statusCode: response.statusCode,
                        message: response.message,
                    };
                }
                clearSession(response.message, 'success');
                if (browser) {
                    await goto(appRoutePath.auth.login);
                }
                return formatResult(response);
            } catch (error) {
                clearSession((error as ApiResponse<unknown>)?.message ?? 'Logout failed', 'error');
                const fallback: AuthResult = {
                    session: null,
                    status: (error as ApiResponse<unknown>)?.statusCode ?? 500,
                    message: (error as ApiResponse<unknown>)?.message ?? 'Logout failed',
                    error: (error as ApiResponse<unknown>)?.error ?? null,
                };
                return fallback;
            }
        },
    };
}

export const authStore = createAuthStore();
