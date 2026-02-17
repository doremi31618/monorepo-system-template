import { Controller, Post, Body, Param, Get, Query, Put, Patch, Req } from '@nestjs/common';
import { CmsService } from './cms.service.js';

@Controller('cms/posts')
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    @Post()
    async create(@Body() body: { title: string; locale?: string }, @Req() req: any) {
        const userId = req.user?.id || 1;
        return this.cmsService.createPost(userId, body.title, body.locale);
    }

    @Get()
    async list(@Query('page') page: number, @Query('limit') limit: number, @Query('locale') locale: string) {
        return this.cmsService.listPosts(Number(page) || 1, Number(limit) || 10, locale || 'en');
    }

    @Get(':id')
    async get(@Param('id') id: string, @Query('locale') locale: string) {
        return this.cmsService.getPost(id, locale || 'en');
    }

    @Put(':id/content')
    async updateContent(
        @Param('id') id: string,
        @Query('locale') locale: string,
        @Body() body: { title?: string; body?: any; seoTitle?: string; seoDesc?: string }
    ) {
        return this.cmsService.updatePostContent(id, locale || 'en', body);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body() body: { status: string; slug?: string }) {
        return this.cmsService.updatePostStatus(id, body.status, body.slug);
    }
}
