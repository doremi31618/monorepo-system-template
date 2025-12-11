export type ApiResponse<T> = {
    error?: string | null;
    statusCode: number;
    message: string;
    data?: T | null;
    timestamp?: string;
    path?: string;
};
//# sourceMappingURL=common.d.ts.map