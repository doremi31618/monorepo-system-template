import { authStore } from '$lib/store/authStore';
import { appRoutePath } from '$lib/config/route';
import { redirect } from '@sveltejs/kit';

export const ssr = false;

export async function load() {
    if (!await authStore.isAuthenticated()) {
        const result = await authStore.refreshSession();
        if (!result.session) {
            throw redirect(303, appRoutePath.auth.login);
        }
    }

    try {
        const user = await authStore.fetchUser();

        if (!user) {
            throw redirect(302, appRoutePath.auth.login);
        }

        const hasAdminRole = user.userRoles?.some(role => role.role.id === 'admin');
        if (!hasAdminRole) {
            throw redirect(302, appRoutePath.auth.login);
        }
        return { user }
    } catch (e) {
        // If API fails (e.g. 401 refresh token expired), redirect to login
        throw redirect(302, appRoutePath.auth.login);
    }
}