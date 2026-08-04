import { AppConfig } from '$lib/config';

interface UploadOptions {
    file: File;
    onProgress?: (progress: number) => void;
}

export interface UploadedAsset {
    id: string;
    storageKey: string;
    status: 'pending' | 'ready';
    mimeType: string;
    size: number;
    visibility: string;
    createdAt: string;
    updatedAt: string;
}

type WrappedResponse<T> = {
    data?: T;
};

function unwrapResponseAsset(payload: unknown): UploadedAsset {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid upload response payload');
    }

    const wrapped = payload as WrappedResponse<UploadedAsset>;
    const candidate = wrapped.data ?? (payload as UploadedAsset);

    if (!candidate?.id) {
        throw new Error('Upload succeeded but asset id is missing in response');
    }

    return candidate;
}

export async function uploadAsset(options: UploadOptions): Promise<UploadedAsset> {
    const { file, onProgress } = options;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${AppConfig.apiBaseUrl}/cms/assets/upload`);
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(unwrapResponseAsset(response));
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error('Upload failed'));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}
