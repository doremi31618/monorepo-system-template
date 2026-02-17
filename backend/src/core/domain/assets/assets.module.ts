import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import { S3StorageStrategy } from './storage/s3.storage.js';

@Module({
    imports: [ConfigModule],
    controllers: [AssetsController],
    providers: [
        AssetsService,
        {
            provide: 'StorageStrategy',
            useClass: S3StorageStrategy,
        },
    ],
    exports: [AssetsService],
})
export class AssetsModule { }
