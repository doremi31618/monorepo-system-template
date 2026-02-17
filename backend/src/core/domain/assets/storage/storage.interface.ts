export interface PresignedUrlOptions {
    key: string;
    contentType?: string;
    expiresIn?: number;
}

export interface IStorageStrategy {
    presignPut(options: PresignedUrlOptions): Promise<string>;
    presignGet(key: string, expiresIn?: number): Promise<string>;
    head(key: string): Promise<{ size: number; etag?: string; contentType?: string }>;
    delete(key: string): Promise<void>;
    upload(buffer: Buffer, key: string, mimeType: string): Promise<void>;
}
