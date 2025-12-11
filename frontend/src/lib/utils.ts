import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SDK } from '@share/sdk';
import { AppConfig } from '$lib/config';
import { browser } from '$app/environment';

export const httpClient = new SDK.Frontend.HttpClient(AppConfig.apiBaseUrl, {
	useLocalStorage: browser,
	storageKey: AppConfig.sessionStorageKey,
	refreshPath: '/auth/refresh',
});


export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
