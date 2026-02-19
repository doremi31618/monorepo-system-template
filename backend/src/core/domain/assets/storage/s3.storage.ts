import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageStrategy, PresignedUrlOptions } from './storage.interface.js';

@Injectable()
export class S3StorageStrategy implements IStorageStrategy {
    private s3Client: S3Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
        const region = this.configService.get<string>('STORAGE_REGION', 'us-east-1');
        const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
        const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY');
        const secretAccessKey = this.configService.get<string>('STORAGE_SECRET_KEY');
        const forcePathStyle = this.configService.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true';

        this.bucket = this.configService.getOrThrow<string>('STORAGE_BUCKET');

        this.s3Client = new S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle,
        });
    }

    async presignPut(options: PresignedUrlOptions): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: options.key,
            ContentType: options.contentType,
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn: options.expiresIn ?? 3600 });
        } catch (error) {
            throw new InternalServerErrorException(`Failed to generate presigned PUT url: ${(error as Error).message}`);
        }
    }

    async presignGet(key: string, expiresIn = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        try {
            return await getSignedUrl(this.s3Client, command, { expiresIn });
        } catch (error) {
            throw new InternalServerErrorException(`Failed to generate presigned GET url: ${(error as Error).message}`);
        }
    }

    async head(key: string): Promise<{ size: number; etag?: string; contentType?: string }> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            return {
                size: response.ContentLength || 0,
                etag: response.ETag,
                contentType: response.ContentType,
            };
        } catch (error) {
            // Re-throw or handle "NotFound" specifically if needed
            throw error;
        }
    }

    async upload(buffer: Buffer, key: string, mimeType: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        });

        try {
            await this.s3Client.send(command);
        } catch (error) {
            throw new InternalServerErrorException(`Failed to upload file to S3: ${(error as Error).message}`);
        }
    }

    async delete(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        try {
            await this.s3Client.send(command);
        } catch (error) {
            throw new InternalServerErrorException(`Failed to delete file from S3: ${(error as Error).message}`);
        }
    }
}
