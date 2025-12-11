import { type ApiResponse } from '@share/contract';
import StorageService from "./storageService.js";

export type HttpClientOptions<T> = {
    useLocalStorage?: boolean;
    storageKey?: string;
    refreshPath?: string;
    initialSession?: T;
}

type SafeParseResult<T> = { body: T | null; parsed: boolean };

export class HttpClient<T = { token?: string }> {
    private baseUrl: string;
    private refreshPath: string;
    private storage: StorageService<T>;

    constructor(baseUrl: string, options: HttpClientOptions<T> = {}) {
        this.baseUrl = baseUrl;
        this.refreshPath = options.refreshPath ?? '/auth/refresh';
        const storageKey = options.storageKey ?? 'session';
        const initialSession = options.initialSession ?? {} as T;

        // StorageService internal logic handles useLocalStorage check or fallback to memory
        // But we might want to respect options.useLocalStorage if provided to force memory mode?
        // StorageService defaults to false logic if window is undefined, but if useLocalStorage is explicit false in options...
        // The current StorageService logic: if(storageKey) -> true. if(window undefined) -> false.
        // We can just rely on that for now, passing storageKey.
        this.storage = new StorageService<T>(initialSession, options.useLocalStorage === false ? undefined : storageKey);
    }

    private get token(): string | undefined {
        const session = this.storage.content;
        if (!session) return undefined;
        // Handle the mixed type logic from original frontend code: string or object with token
        if (typeof session === 'string') return session;
        return (session as any).token;
    }

    private get authorizationHeader(): Record<string, string> {
        const token = this.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private updateSession(token: string) {
        const current = this.storage.content;
        if (typeof current === 'string') {
            // If it was a string, and we are updating, do we stay string? 
            // Original code: if string -> set to { token }. 
            // Line 58 in frontend: localStorage.setItem(..., JSON.stringify({ token }));
            // So it migrates to object found.
            this.storage.content = { token } as any;
        } else {
            this.storage.content = { ...current, token } as any;
        }
    }

    private async safeParse<R>(response: Response): Promise<SafeParseResult<R>> {
        try {
            return {
                body: await response.json() as R,
                parsed: true,
            };
        } catch {
            return { body: null, parsed: false };
        }
    }

    private async safeErrorMessage<R>(
        response: Response,
        parsedBody?: ApiResponse<R>,
        alreadyParsed = false
    ): Promise<string> {
        if (parsedBody) {
            return parsedBody.message ?? `HTTP ${parsedBody.statusCode ?? response.status} error`;
        }
        if (alreadyParsed) {
            return `HTTP ${response.status}`;
        }
        try {
            const data = await response.json() as ApiResponse<R>;
            return data.message ?? `HTTP ${data.statusCode} error`;
        } catch (error) {
            console.error(error);
            return `HTTP ${response.status}`;
        }
    }

    private async refreshToken(): Promise<string | undefined> {
        // Prevent infinite loops or overlapping refreshes could be handled here with a pending promise
        // For simplicity, implementing the basic fetch first.
        // Note: The original had a pendingRefresh logic. We should implement that.
        // Since we are in a class, we can have a private property.

        return this._refreshToken();
    }

    private pendingRefresh: Promise<string> | null = null;

    private async _refreshToken(): Promise<string> {
        if (!this.pendingRefresh) {
            this.pendingRefresh = (async () => {
                const refreshResponse = await fetch(`${this.baseUrl}${this.refreshPath}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.authorizationHeader,
                    },
                });

                const { body: refreshData, parsed } = await this.safeParse<ApiResponse<{ token?: string; sessionToken?: string }>>(refreshResponse);

                if (!refreshResponse.ok) {
                    throw {
                        error: await this.safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                        statusCode: refreshData?.statusCode ?? refreshResponse.status,
                        message: refreshData?.message ?? await this.safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                    }
                }

                const nextToken = refreshData?.data?.token ?? refreshData?.data?.sessionToken;

                if (nextToken) {
                    this.updateSession(nextToken);
                    return nextToken;
                }

                throw {
                    error: await this.safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                    statusCode: refreshData?.statusCode ?? refreshResponse.status,
                    message: refreshData?.message ?? await this.safeErrorMessage(refreshResponse, refreshData ?? undefined, parsed),
                }
            })();

            this.pendingRefresh.finally(() => {
                this.pendingRefresh = null;
            });
        }
        return this.pendingRefresh;
    }

    private async rawRequest(path: string, options: RequestInit = {}): Promise<Response> {
        const headers = {
            'Content-Type': 'application/json',
            ...this.authorizationHeader,
            ...(options.headers ?? {}),
        };
        return await fetch(`${this.baseUrl}${path}`, {
            ...options,
            credentials: 'include',
            headers,
        });
    }

    private async request<R>(path: string, options: RequestInit = {}): Promise<ApiResponse<R>> {
        try {
            const res = await this.rawRequest(path, options);

            if (res.ok) {
                const { body } = await this.safeParse<ApiResponse<R>>(res);
                return body as ApiResponse<R>;
            }

            const { body: data, parsed } = await this.safeParse<ApiResponse<R>>(res);
            const isUnauthorized =
                res.status === 401 || data?.statusCode === 401 || data?.error === 'Unauthorized';

            if (isUnauthorized) {
                try {
                    const newToken = await this.refreshToken();
                    if (!newToken) {
                        throw {
                            error: 'Failed to refresh token',
                            statusCode: 401,
                            message: 'Failed to refresh token',
                        };
                    }
                } catch (refreshErr) {
                    // If refresh fails, we throw the refresh error, effectively logging out or rejecting
                    throw refreshErr;
                }

                // If refresh succeeded, retry original request
                const retryResponse = await this.rawRequest(path, { ...options });
                if (retryResponse.ok) {
                    const { body: retryBody } = await this.safeParse<ApiResponse<R>>(retryResponse);
                    return retryBody as ApiResponse<R>;
                }
                const { body: retryData, parsed: retryParsed } = await this.safeParse<ApiResponse<R>>(retryResponse);
                throw {
                    error: await this.safeErrorMessage(retryResponse, retryData ?? undefined, retryParsed),
                    statusCode: retryData?.statusCode ?? retryResponse.status,
                    message: retryData?.message ?? await this.safeErrorMessage(retryResponse, retryData ?? undefined, retryParsed),
                };
            }

            throw {
                error: await this.safeErrorMessage(res, data ?? undefined, parsed),
                statusCode: data?.statusCode ?? res.status,
                message: data?.message ?? await this.safeErrorMessage(res, data ?? undefined, parsed),
            };
        } catch (error: any) {
            const fallback = {
                error: 'network_error',
                statusCode: 500,
                message: error.message ?? 'Network issue: Failed to make request',
            };
            throw typeof error === 'object' && error !== null ? { ...fallback, ...error } : fallback;
        }
    }

    public get<R>(path: string): Promise<ApiResponse<R>> {
        return this.request<R>(path, { method: 'GET' });
    }

    public post<R>(path: string, data: unknown): Promise<ApiResponse<R>> {
        return this.request<R>(path, { method: 'POST', body: JSON.stringify(data) });
    }

    public put<R>(path: string, data: unknown): Promise<ApiResponse<R>> {
        return this.request<R>(path, { method: 'PUT', body: JSON.stringify(data) });
    }

    public delete<R>(path: string): Promise<ApiResponse<R>> {
        return this.request<R>(path, { method: 'DELETE' });
    }
}