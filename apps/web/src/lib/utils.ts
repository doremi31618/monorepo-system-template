export {
	cn,
	type WithElementRef,
	type WithoutChild,
	type WithoutChildren,
	type WithoutChildrenOrChild
} from '@platform/svelte-ui';
import { SDK } from '@platform/browser-sdk';
import { AppConfig } from '$lib/config';
import { browser } from '$app/environment';

export const httpClient = new SDK.Frontend.HttpClient(AppConfig.apiBaseUrl, {
	useLocalStorage: browser,
	storageKey: AppConfig.sessionStorageKey,
	refreshPath: '/auth/refresh',
});
