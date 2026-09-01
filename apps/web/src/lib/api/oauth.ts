import { AppConfig } from '$lib/config';

export type OAuthInteractionDetails = {
	uid: string;
	prompt: string;
	client: { id: string; name: string };
	redirectUri: string;
	resources: string[];
	scopes: string[];
	authenticated: boolean;
};

export async function getInteraction(uid: string) {
	return request<OAuthInteractionDetails>(uid);
}

type ApiResponse<T> = { data?: T | null; statusCode?: number; message?: string };

function sessionToken(): string | undefined {
	const value = localStorage.getItem(AppConfig.sessionStorageKey);
	if (!value) return undefined;
	try {
		const session = JSON.parse(value) as { token?: string } | string;
		return typeof session === 'string' ? session : session.token;
	} catch {
		return undefined;
	}
}

async function request<T>(uid: string, action?: string): Promise<ApiResponse<T>> {
	const apiOrigin = AppConfig.apiBaseUrl.replace(/\/v1\/?$/, '');
	const token = sessionToken();
	const response = await fetch(
		`${apiOrigin}/oauth/interaction/${encodeURIComponent(uid)}${action ? `/${action}` : ''}`,
		{
			method: action ? 'POST' : 'GET',
			credentials: 'include',
			headers: {
				...(action ? { 'content-type': 'application/json' } : {}),
				...(token ? { authorization: `Bearer ${token}` } : {})
			},
			...(action ? { body: '{}' } : {})
		}
	);
	const body = (await response.json()) as ApiResponse<T>;
	if (!response.ok) throw body;
	return body;
}

async function submitInteraction(uid: string, action: 'login' | 'consent' | 'deny') {
	return request<{ redirectTo: string }>(uid, action);
}

export const resumeOAuthLogin = (uid: string) => submitInteraction(uid, 'login');
export const approveOAuthConsent = (uid: string) => submitInteraction(uid, 'consent');
export const denyOAuthConsent = (uid: string) => submitInteraction(uid, 'deny');
