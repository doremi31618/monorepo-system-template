import { appRoutePath } from './route';

export type AppConfig = {

    apiBaseUrl: string;
    sessionStorageKey: string;
    useMockApi: boolean;
    route: typeof appRoutePath;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3333';

export const AppConfig: AppConfig = {
    apiBaseUrl,
    sessionStorageKey: 'app.session.v1',
    useMockApi: false,
    route: appRoutePath,
}
