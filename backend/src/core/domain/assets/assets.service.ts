import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { assets } from './assets.schema.js';
import type { IStorageStrategy } from './storage/storage.interface.js';
// import { S3StorageStrategy } from './storage/s3.storage.js'; // Direct import or use token
// import { DrizzleProvider } from '../../infra/db/drizzle.provider'; // Adjust import based on your setup
// import { schema } from '../../infra/db/schema.js';

@Injectable()
export class AssetsService {
    private bucket: string;

    constructor(
        @Inject('DB') private db: NodePgDatabase<any>, // Adjust injection token
        private configService: ConfigService,
        @Inject('StorageStrategy') private storage: IStorageStrategy,
    ) {
        this.bucket = this.configService.getOrThrow<string>('STORAGE_BUCKET');
    }

    async initUpload(filename: string, mimeType: string, size: number, ownerId: number) {
        const assetId = uuidv4();
        const extension = filename.split('.').pop();
        const storageKey = `${ownerId}/${assetId}.${extension}`;

        // 1. Generate Presigned PUT URL
        const uploadUrl = await this.storage.presignPut({
            key: storageKey,
            contentType: mimeType,
            expiresIn: 3600,
        });

        // 2. Insert into DB with 'pending' status
        await this.db.insert(assets).values({
            id: assetId,
            storageProvider: this.configService.get('STORAGE_PROVIDER', 's3'),
            bucket: this.bucket,
            storageKey: storageKey,
            status: 'pending',
            mimeType: mimeType,
            size: size,
            ownerId: ownerId,
            visibility: 'public',
        });

        return {
            assetId,
            uploadUrl,
            storageKey,
        };
    }

    async completeUpload(assetId: string) {
        const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId));

        if (!asset) {
            throw new NotFoundException('Asset not found');
        }

        if (asset.status === 'ready') {
            return asset;
        }
        // 1. Check file existence and metadata on Storage
        try {
            const metadata = await this.storage.head(asset.storageKey);

            // Optional: Validate size
            // if (metadata.size !== asset.size) { ... }

            // 2. Update DB status to 'ready'
            await this.db
                .update(assets)
                .set({
                    status: 'ready',
                    size: metadata.size, // Update size from actual file
                    updatedAt: new Date()
                })
                .where(eq(assets.id, assetId));

            return { ...asset, status: 'ready', size: metadata.size };

        } catch (error) {
            // If HEAD fails, it means upload didn't happen or failed
            throw new BadRequestException('File verification failed on storage');
        }
    }

    async getDownloadUrl(assetId: string) {
        const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId));

        if (!asset || asset.status !== 'ready') {
            throw new NotFoundException('Asset not ready or found');
        }

        const url = await this.storage.presignGet(asset.storageKey);
        return { url };
    }

    async listAssets(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        // Simple mock list for now
        const results = await this.db.select().from(assets).limit(limit).offset(offset);
        return { data: results, page, limit };
    }
    async uploadFile(file: Express.Multer.File, ownerId: number) {
        const assetId = uuidv4();
        const extension = file.originalname.split('.').pop();
        const storageKey = `${ownerId}/${assetId}.${extension}`;

        // 1. Upload to Storage
        await this.storage.upload(file.buffer, storageKey, file.mimetype);

        // 2. Insert into DB
        const [asset] = await this.db.insert(assets).values({
            id: assetId,
            storageProvider: this.configService.get('STORAGE_PROVIDER', 's3'),
            bucket: this.bucket,
            storageKey: storageKey,
            status: 'ready', // Direct upload is ready immediately
            mimeType: file.mimetype,
            size: file.size,
            ownerId: ownerId,
            visibility: 'public',
        }).returning();

        return asset;
    }
}
