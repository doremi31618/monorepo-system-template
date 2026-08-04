import {authStore} from '$lib/store/authStore';
import { appRoutePath } from '$lib/config/route';
import { redirect } from '@sveltejs/kit';

export function load(){
    if (! authStore.isAuthenticated()){
        throw redirect(303, appRoutePath.auth.login);
    }
    return {}
}