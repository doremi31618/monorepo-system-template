import { browser } from '$app/environment';
import { AppConfig } from '$lib/config';


// how to use the httpClient
// Example: 
//--------------------------------
// src/lib/api/todos.ts
// import { httpClient } from './httpClient';
// export async function getTodos() {
//   return httpClient.get('/todos');
// }
// export async function addTodo(text: string) {
//   return httpClient.post('/todos', { text });
// }
//--------------------------------
// implement with store 
// Example: 
// import { getTodos, addTodo } from '$lib/api/todos';
// onMount(async () => {
//     const todos = await getTodos();
//     console.log(todos);
//   });
//   await addTodo('Buy coffee');
//--------------------------------

export type ApiResponse<T> = {
    error?: string | null;
    statusCode: number;
    message: string;
    data?: T | null;
    timestamp?: string;
    path?: string;
}

function authorizationHeader(): Record<string, string> {
    if (!browser) return {};
    const raw = localStorage.getItem(AppConfig.sessionStorageKey);
    if (!raw) return {};
    try {
        const session = JSON.parse(raw) as { token?: string | null } | string;
        const token = typeof session === 'string' ? session : session?.token;
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
    } catch (error) {
        console.error('Failed to read session token', error);
    }
    return {};
}

function updateStoredSessionToken(token: string) {
    if (!browser) return;
    const raw = localStorage.getItem(AppConfig.sessionStorageKey);
    if (!raw) {
        localStorage.setItem(
            AppConfig.sessionStorageKey,
            JSON.stringify({ token })
        );
        return;
    }
    try {
        const session = JSON.parse(raw) as { token?: string } | string;
        if (typeof session === 'string') {
            localStorage.setItem(
                AppConfig.sessionStorageKey,
                JSON.stringify({ token })
            );
            return;
        }
        localStorage.setItem(
            AppConfig.sessionStorageKey,
            JSON.stringify({ ...session, token })
        );
    } catch (error) {
        console.error('Failed to update session token from storage', error);
        localStorage.setItem(
            AppConfig.sessionStorageKey,
            JSON.stringify({ token })
        );
    }
}

let pendingRefresh: Promise<string> | null = null;

async function refreshToken(): Promise<string> {
    if (!browser) {
        throw new Error('Cannot refresh token outside the browser environment');
    }

    if (!pendingRefresh) {
        pendingRefresh = (async () => {
            const refreshResponse = await fetch(`${AppConfig.apiBaseUrl}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...authorizationHeader(),
                },
            });
            const { body: refreshData, parsed } = await safeParse<ApiResponse<{ token?: string; sessionToken?: string }>>(refreshResponse);

            if (!refreshResponse.ok) {
                throw {
                    error: await safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                    statusCode: refreshData?.statusCode ?? refreshResponse.status,
                    message: refreshData?.message ?? await safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                }
            }

            const nextToken =
                refreshData?.data?.token ?? refreshData?.data?.sessionToken;

            if (nextToken) {
                updateStoredSessionToken(nextToken);
                return nextToken;
            }

            

            throw {
                error: await safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                statusCode: refreshData?.statusCode ?? refreshResponse.status,
                message: refreshData?.message ?? await safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
            }
        })();

        pendingRefresh.finally(() => {
            pendingRefresh = null;
        });
    }

    return pendingRefresh;
}

async function rawRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
        'Content-Type': 'application/json',
        ...authorizationHeader(),
        ...(options.headers ?? {}),
    };
    const res = await fetch(`${AppConfig.apiBaseUrl}${path}`, {
        ...options,
        credentials: 'include',
        headers,
    });
    return res;
}

// try request with refresh token if 401
async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const res = await rawRequest(path, options);

    if (res.ok) {
        return res.json() as Promise<ApiResponse<T>>;
    }

    const { body: data, parsed } = await safeParse<ApiResponse<T>>(res);
    const isUnauthorized =
        res.status === 401 || data?.statusCode === 401 || data?.error === 'Unauthorized';

    if (isUnauthorized) {
        const newToken = await refreshToken();
        if (!newToken) {
            throw {
                error: 'Failed to refresh token',
                statusCode: 401,
                message: 'Failed to refresh token',
            };
        }
        const retryResponse = await rawRequest(path, { ...options });
        if (retryResponse.ok) {
            return retryResponse.json() as Promise<ApiResponse<T>>;
        }
        const { body: retryData, parsed: retryParsed } = await safeParse<ApiResponse<T>>(retryResponse);
        throw {
            error: await safeErrorMessage(retryResponse, retryData ?? undefined, retryParsed),
            statusCode: retryData?.statusCode ?? retryResponse.status,
            message: retryData?.message ?? await safeErrorMessage(retryResponse, retryData ?? undefined, retryParsed),
        };
    }

    throw {
        error: await safeErrorMessage(res, data ?? undefined, parsed),
        statusCode: data?.statusCode ?? res.status,
        message: data?.message ?? await safeErrorMessage(res, data ?? undefined, parsed),
    };
}

type SafeParseResult<T> = { body: T | null; parsed: boolean };

async function safeParse<T>(response: Response): Promise<SafeParseResult<T>> {
    try {
        return {
            body: await response.json() as T,
            parsed: true,
        };
    } catch {
        return { body: null, parsed: false };
    }
}

// get error message from response
async function safeErrorMessage<T>(
    response: Response,
    parsedBody?: ApiResponse<T>,
    alreadyParsed = false
): Promise<string> {
    if (parsedBody) {
        return parsedBody.message ?? `HTTP ${parsedBody.statusCode ?? response.status} error`;
    }
    if (alreadyParsed) {
        return `HTTP ${response.status}`;
    }
    try {
        const data = await response.json() as ApiResponse<T>;
        return data.message ?? `HTTP ${data.statusCode} error`;
    } catch (error) {
        console.error(error);
        return `HTTP ${response.status}`;
    }
}

export const httpClient = {
    get: <T>(path: string): Promise<ApiResponse<T>> => request(path, { method: 'GET' }) as Promise<ApiResponse<T>>,
    post: <T>(path: string, data: unknown): Promise<ApiResponse<T>> => request(path, { method: 'POST', body: JSON.stringify(data) }) as Promise<ApiResponse<T>>,
    put: <T>(path: string, data: unknown): Promise<ApiResponse<T>> => request(path, { method: 'PUT', body: JSON.stringify(data) }) as Promise<ApiResponse<T>>,
    delete: <T>(path: string): Promise<ApiResponse<T>> => request(path, { method: 'DELETE' }) as Promise<ApiResponse<T>>,
}
