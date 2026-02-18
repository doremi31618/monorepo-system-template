import { Controller, Post, Body, Param, Get, Query, Req, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service.js';
// import { z } from 'zod'; // Assuming Zod is used for validation, or generic pipes
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Adjust guards
// import { RequirePermissions } from '../../access-control/decorators/require-permissions.decorator';

// Validation DTOs (Simplified for execution)
interface InitUploadDto {
    filename: string;
    mimeType: string;
    size: number;
}

@Controller('cms/assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Post('init')
    // @UseGuards(JwtAuthGuard)
    // @RequirePermissions('assets.create')
    async initUpload(@Body() body: InitUploadDto, @Req() req: any) {
        // Mock owner ID from request or default
        const ownerId = req.user?.id || 1;
        return this.assetsService.initUpload(body.filename, body.mimeType, body.size, ownerId);
    }

    @Post(':id/complete')
    // @UseGuards(JwtAuthGuard)
    // @RequirePermissions('assets.create')
    async completeUpload(@Param('id') id: string) {
        return this.assetsService.completeUpload(id);
    }

    @Get(':id/url')
    // @UseGuards(JwtAuthGuard)
    // @RequirePermissions('assets.read')
    async getUrl(@Param('id') id: string) {
        return this.assetsService.getDownloadUrl(id);
    }

    @Get()
    // @UseGuards(JwtAuthGuard)
    // @RequirePermissions('assets.read')
    async listAssets(@Query('page') page: number, @Query('limit') limit: number) {
        return this.assetsService.listAssets(Number(page) || 1, Number(limit) || 20);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Req() req: any) {
        // file type is Express.Multer.File but using any to avoid type issues if types are missing
        const ownerId = req.user?.id || 1;
        return this.assetsService.uploadFile(file, ownerId);
    }

    @Delete(':id')
    async deleteAsset(@Param('id') id: string) {
        return this.assetsService.deleteAsset(id);
    }
}
