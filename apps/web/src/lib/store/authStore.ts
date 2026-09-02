import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { AppConfig } from '$lib/config';
import * as authAPI from '$lib/api/auth';
import { appRoutePath } from '$lib/config/route';
import { Frontend } from '@platform/browser-sdk';
type ApiResponse<T> = Frontend.ApiResponse<T>;
// import type { ApiResponse } from '$lib/api/httpClient';
import type { UserWithRoles, Session } from '@platform/types-identity';
import { getMe } from '$lib/api/admin';
export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export type AuthState = {
    session: Session | null;
    user: UserWithRoles | null;
    status: AuthStatus;
    message: string | null;
};

export type AuthResult = {
    session: Session | null;
    status: number;
    message: string;
    error?: string | null;
};

export type AuthStore = { subscribe: Writable<AuthState>['subscribe'] } & {
    register: (username: string, email: string, password: string) => Promise<AuthResult>;
    getToken: () => Promise<Session | null>;
    login: (email: string, password: string) => Promise<AuthResult>;
    logout: () => Promise<AuthResult>;
    InspectSession: () => Promise<AuthResult>;
    isAuthenticated: () => Promise<boolean>;
    refreshSession: () => Promise<AuthResult>;
    fetchUser: () => Promise<UserWithRoles | null>;
    setSession: (session: Session | null, message?: string | null, status?: AuthStatus) => void;
    clearSession: (message?: string | null, status?: AuthStatus) => void;
};

const STORAGE_KEY = AppConfig.sessionStorageKey;

function readFromStorage(): Session | null {
    if (!browser) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Session | string;
        if (typeof parsed === 'string') {
            return {
                userId: 0,
                name: '',
                token: parsed,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Dummy 24h
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
        return parsed;
    } catch (error) {
        console.error('Failed to parse session from storage', error);
        return null;
    }
}

function writeToStorage(session: Session | null) {
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
        user: null,
        status: 'idle',
        message: null,
    });

    const setSession = (session: Session | null, message: string | null = null, status: AuthStatus = message ? 'success' : 'idle') => {
        update(state => ({ ...state, session, status, message }));
        writeToStorage(session);
    };

    const clearSession = (message: string | null = null, status: AuthStatus = 'idle') => {
        set({ session: null, user: null, status, message });
        writeToStorage(null);
    };

    const formatResult = (response: ApiResponse<Session | { session?: Session | null }> | AuthResult): AuthResult => {
        if ('status' in response) {
            return response;
        }

        // It's ApiResponse
        const session = (response.data as Session | null) ?? (response.data as { session?: Session | null })?.session ?? null;
        return {
            session,
            status: response.statusCode,
            message: response.message,
            error: response.error,
        };
    };

    return {
        subscribe,
        setSession,
        clearSession,
        async refreshSession() {
            update((state) => ({ ...state, status: 'loading' as const, message: null }));
            try {
                const response = await authAPI.refresh() as ApiResponse<Session>;
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
        async fetchUser() {
            let currentUser: UserWithRoles | null = null;
            update(state => {
                currentUser = state.user;
                return state;
            });

            // Return cached user if available
            if (currentUser) {
                return currentUser;
            }

            // Fetch from API
            update(state => ({ ...state, status: 'loading' }));
            try {
                const response = await getMe();
                // Ensure we unwrap the response correctly
                const user = response.data;
                update(state => ({
                    ...state,
                    user: user ?? null,
                    status: 'success'
                }));
                return user ?? null;
            } catch (error) {
                console.error('Failed to fetch user profile', error);
                const isAuthError = (error as ApiResponse<unknown>)?.statusCode === 401;
                if (isAuthError) {
                    clearSession('Session expired', 'error');
                }
                update(state => ({ ...state, status: 'error' }));
                return null;
            }
        },
        async InspectSession() {
            update((state) => ({ ...state, status: 'loading' as const, message: null }));
            try {
                const response = await authAPI.InspectSession();
                if (response.statusCode !== 200) {
                    throw {
                        error: 'Failed to inspect session',
                        statusCode: response.statusCode,
                        message: response.message,
                    };
                }
                const session = (response.data ?? null) as Session | null;
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
            update((state) => ({ ...state, status: 'loading' as const, message: null }));
            try {
                const response = await authAPI.register(username, email, password);
                const session = (response.data ?? null) as Session | null;
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
            update((state) => ({ ...state, status: 'loading' as const, message: null }));
            try {
                const response = await authAPI.login(email, password);
                const session = (response.data ?? null) as Session | null;
                if (!session) {
                    throw {
                        error: 'Failed to retrieve session during login',
                        statusCode: response.statusCode,
                        message: response.message,
                    } as ApiResponse<Session>;
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
            update((state: AuthState) => ({ ...state, status: 'loading' as const, message: null }));
            try {
                const response = await authAPI.logout();
                if (response.statusCode !== 200) {
                    throw {
                        error: 'Failed to logout',
                        statusCode: response.statusCode,
                        message: response.message ?? 'Failed to logout',
                    };
                }
                clearSession(response.message, 'success');
                // clearSession already sets user to null
                if (browser) {
                    await goto(appRoutePath.auth.login);
                }
                return {
                    session: null,
                    status: response.statusCode ?? 200,
                    message: response.message ?? 'Logged out successfully',
                    error: null
                };
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
