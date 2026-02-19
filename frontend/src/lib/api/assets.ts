
import { httpClient } from '../utils';
import { AppConfig } from '$lib/config';

export interface Asset {
    id: string;
    storageKey: string;
    originalName?: string;
    status: 'pending' | 'ready' | 'deleted';
    mimeType: string;
    size: number;
    visibility: string;
    createdAt: string;
    updatedAt: string;
}

export interface ListAssetsResponse {
    data: Asset[];
    page: number;
    limit: number;
    total?: number;
}

export interface InitUploadResponse {
    assetId: string;
    uploadUrl: string;
    storageKey: string;
}

export async function listAssets(params: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    mimePrefix?: string;
} = {}) {
    const queryParams = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
    });

    if (params.query?.trim()) {
        queryParams.set('query', params.query.trim());
    }

    if (params.status && params.status !== 'all') {
        queryParams.set('status', params.status);
    }

    if (params.mimePrefix && params.mimePrefix !== 'all') {
        queryParams.set('mimePrefix', params.mimePrefix);
    }

    const query = queryParams.toString();
    return await httpClient.get<ListAssetsResponse>(`/cms/assets?${query}`);
}

export async function initUpload(filename: string, mimeType: string, size: number) {
    return await httpClient.post<InitUploadResponse>('/cms/assets/init', {
        filename,
        mimeType,
        size
    });
}

export async function completeUpload(id: string) {
    return await httpClient.post<Asset>(`/cms/assets/${id}/complete`, {});
}

export async function getDownloadUrl(id: string) {
    return await httpClient.get<{ url: string }>(`/cms/assets/${id}/url`);
}

export function getAssetPublicUrl(id: string) {
    return `${AppConfig.apiBaseUrl}/cms/assets/${id}/public`;
}

export async function deleteAsset(id: string) {
    return await httpClient.delete<{ id: string; deleted: boolean }>(`/cms/assets/${id}`);
}

export async function updateAsset(id: string, data: { originalName?: string; status?: 'pending' | 'ready' }) {
    return await httpClient.put<Asset>(`/cms/assets/${id}`, data);
}
