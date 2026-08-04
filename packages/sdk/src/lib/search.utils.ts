
import { type SearchParams, type PaginatedResult } from '@platform/contracts';

export class SearchUtils {
    static buildQuery(params: SearchParams): string {
        const queryParts: string[] = [];
        if (params.page) queryParts.push(`page=${params.page}`);
        if (params.limit) queryParts.push(`limit=${params.limit}`);
        if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
        if (params.sort) queryParts.push(`sort=${params.sort}`);
        if (params.order) queryParts.push(`order=${params.order}`);

        // Handle filters (e.g. filter[role]=admin)
        if (params.filter) {
            Object.entries(params.filter).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParts.push(`filter[${key}]=${encodeURIComponent(String(value))}`);
                }
            });
        }

        return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    }

    static createPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
