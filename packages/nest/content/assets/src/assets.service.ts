import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { assets } from './assets.schema.js';
import type { IStorageStrategy } from './storage/storage.interface.js';
import type { Asset, AssetStatus, InitUploadResponse, ListAssetsResponse } from '@platform/types-content';
import { parseAssetSorts, type AssetSortProperty } from './list-assets-query.js';
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

    private toAsset(row: typeof assets.$inferSelect): Asset {
        if (!['pending', 'ready', 'deleted'].includes(row.status)) {
            throw new BadRequestException(`Invalid persisted asset status: ${row.status}`);
        }
        return { ...row, status: row.status as AssetStatus };
    }

    async initUpload(filename: string, mimeType: string, size: number, ownerId: number): Promise<InitUploadResponse> {
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
            originalName: filename,
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

    async completeUpload(assetId: string): Promise<Asset> {
        const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId));

        if (!asset) {
            throw new NotFoundException('Asset not found');
        }

        if (asset.status === 'ready') {
            return this.toAsset(asset);
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

            return this.toAsset({ ...asset, status: 'ready', size: metadata.size });

        } catch {
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

    async listAssets(
        page = 1,
        limit = 20,
        options: { query?: string; status?: string; mimePrefix?: string; visibility?: string; sort?: string | string[] } = {}
    ): Promise<ListAssetsResponse> {
        const offset = (page - 1) * limit;
        const normalizedQuery = options.query?.trim();
        const normalizedStatus = options.status?.trim();
        const normalizedMimePrefix = options.mimePrefix?.trim();
        const normalizedVisibility = options.visibility?.trim();
        const conditions: any[] = [];

        if (normalizedStatus && normalizedStatus !== 'all') {
            conditions.push(eq(assets.status, normalizedStatus));
        }

        if (normalizedMimePrefix && normalizedMimePrefix !== 'all') {
            conditions.push(ilike(assets.mimeType, `${normalizedMimePrefix}%`));
        }

        if (normalizedVisibility && normalizedVisibility !== 'all') {
            conditions.push(eq(assets.visibility, normalizedVisibility));
        }

        if (normalizedQuery) {
            const keyword = `%${normalizedQuery}%`;
            conditions.push(or(
                ilike(assets.originalName, keyword),
                ilike(assets.storageKey, keyword),
            ));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const sortColumns: Record<AssetSortProperty, any> = {
            createdAt: assets.createdAt,
            updatedAt: assets.updatedAt,
            name: assets.originalName,
            size: assets.size,
        };
        const orderBy = [
            ...parseAssetSorts(options.sort).map((sort) =>
                sort.direction === 'asc'
                    ? asc(sortColumns[sort.property])
                    : desc(sortColumns[sort.property]),
            ),
            asc(assets.id),
        ];

        const results = await this.db
            .select()
            .from(assets)
            .where(whereClause)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

        const [totalResult] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(assets)
            .where(whereClause);

        return {
            data: results.map((asset) => this.toAsset(asset)),
            page,
            limit,
            total: Number(totalResult?.total ?? 0),
        };
    }

    async updateAsset(
        assetId: string,
        data: { originalName?: string; status?: string }
    ): Promise<Asset> {
        const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId));

        if (!asset) {
            throw new NotFoundException('Asset not found');
        }

        const nextOriginalName = data.originalName?.trim();
        if (data.originalName !== undefined && !nextOriginalName) {
            throw new BadRequestException('Asset name is required');
        }

        const nextStatus = data.status?.trim();
        if (nextStatus !== undefined && !['pending', 'ready'].includes(nextStatus)) {
            throw new BadRequestException('Invalid asset status');
        }

        const payload: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (nextOriginalName !== undefined) {
            payload.originalName = nextOriginalName;
        }

        if (nextStatus !== undefined) {
            payload.status = nextStatus;
        }

        const [updated] = await this.db
            .update(assets)
            .set(payload)
            .where(eq(assets.id, assetId))
            .returning();

        return this.toAsset(updated);
    }

    async uploadFile(file: Express.Multer.File, ownerId: number): Promise<Asset> {
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
            originalName: file.originalname,
            status: 'ready', // Direct upload is ready immediately
            mimeType: file.mimetype,
            size: file.size,
            ownerId: ownerId,
            visibility: 'public',
        }).returning();

        return this.toAsset(asset);
    }

    async deleteAsset(assetId: string) {
        const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId));

        if (!asset) {
            throw new NotFoundException('Asset not found');
        }

        await this.storage.delete(asset.storageKey);
        await this.db.delete(assets).where(eq(assets.id, assetId));

        return { id: assetId, deleted: true };
    }
}
