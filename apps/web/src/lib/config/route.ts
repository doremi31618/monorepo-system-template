


export const appRoutePath = {
    base: '/',
    auth: {
        login: '/auth/login',
        register: '/auth/signup',
        signout: '/auth/signout',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset',
    },
    user: {
        home: '/user/home',
    },
    blog: {
        list: '/blog',
    },
    admin: {
        dashboard: '/admin',
        users: '/admin/users',
        roles: '/admin/roles',
        cms: '/admin/cms',
        assets: '/admin/assets',
    }
} as const;
