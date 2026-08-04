import type { LayoutLoad } from "./$types";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { authStore } from "$lib/store/authStore";
import { appRoutePath } from "$lib/config/route";

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
    const token = url.searchParams.get('token');

    if (!browser) return;

    if (token) {
        await authStore.refreshSession();
        console.log('token', token, 'goto', appRoutePath.user.home);
        await goto(appRoutePath.user.home);
        return;
    }
    console.log('no token, goto login');

    // await goto(appRoutePath.auth.login);
};
