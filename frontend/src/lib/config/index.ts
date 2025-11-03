import { appRoutePath } from './route';

export type AppConfig = {

    apiBaseUrl: string;
    sessionStorageKey: string;
    useMockApi: boolean;
    route: typeof appRoutePath;
}

export const AppConfig: AppConfig = {
    apiBaseUrl: 'http://localhost:3333',
    sessionStorageKey: 'app.session.v1',
    useMockApi: false,
    route: appRoutePath,
}