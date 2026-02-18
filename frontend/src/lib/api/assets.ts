
import { httpClient } from '../utils';

export interface Asset {
    id: string;
    storageKey: string;
    status: 'pending' | 'ready';
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
}

export interface InitUploadResponse {
    assetId: string;
    uploadUrl: string;
    storageKey: string;
}

export async function listAssets(page: number = 1, limit: number = 20) {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    }).toString();
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

export async function deleteAsset(id: string) {
    return await httpClient.delete<{ id: string; deleted: boolean }>(`/cms/assets/${id}`);
}
