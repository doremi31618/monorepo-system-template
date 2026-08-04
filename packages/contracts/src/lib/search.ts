
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface SearchParams extends PaginationParams {
    q?: string;
    filter?: Record<string, any>;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
