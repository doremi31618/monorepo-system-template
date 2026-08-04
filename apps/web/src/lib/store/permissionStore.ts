import { writable, type Writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import * as adminApi from '$lib/api/admin';

export type PermissionState = {
    permissions: string[];
    isLoaded: boolean;
};

function createPermissionStore() {
    const { subscribe, set, update } = writable<PermissionState>({
        permissions: [],
        isLoaded: false
    });

    return {
        subscribe,
        /**
         * Load permissions from API.
         * Typically called during app initialization (e.g. Layout mount) or after login.
         */
        async loadPermissions() {
            if (!browser) return;
            try {
                const res = await adminApi.getMyPermissions();
                if (res.data) {
                    set({ permissions: res.data, isLoaded: true });
                } else {
                    set({ permissions: [], isLoaded: true });
                }
            } catch (e) {
                console.error('Failed to load permissions', e);
                set({ permissions: [], isLoaded: true });
            }
        },

        // Manual set for testing or after login success
        setPermissions(permissions: string[]) {
            set({ permissions, isLoaded: true });
        },

        hasPermission(permission: string): boolean {
            const state = get({ subscribe });
            // Super admin check could be done here if we knew the role 'admin' has '*' implicitly.
            // For now, strict check.
            return state.permissions.includes(permission) || state.permissions.includes('*');
        },

        reset() {
            set({ permissions: [], isLoaded: false });
        }
    };
}

export const permissionStore = createPermissionStore();
