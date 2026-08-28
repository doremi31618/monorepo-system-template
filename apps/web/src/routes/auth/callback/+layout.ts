import type { LayoutLoad } from "./$types";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { authStore } from "$lib/store/authStore";
import { appRoutePath } from "$lib/config/route";

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
    const token = url.searchParams.get('token');
    const returnTo = url.searchParams.get('returnTo');

    if (!browser) return;

    if (token || returnTo) {
        await authStore.refreshSession();
        const safeReturnTo = returnTo?.match(/^\/oauth\/interaction\/[A-Za-z0-9_-]+$/)
            ? returnTo
            : appRoutePath.user.home;
        await goto(safeReturnTo);
        return;
    }

    // await goto(appRoutePath.auth.login);
};
