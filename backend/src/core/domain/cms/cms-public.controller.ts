import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CmsService } from './cms.service.js';

@Controller('cms/public')
export class CmsPublicController {
    constructor(private readonly cmsService: CmsService) { }

    @Get('posts')
    async list(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('locale') locale: string,
        @Query('query') query?: string,
        @Query('tagSlug') tagSlug?: string,
        @Query('sort') sort?: 'latest' | 'popular',
    ) {
        return this.cmsService.listPublicPosts(
            Number(page) || 1,
            Number(limit) || 10,
            locale || 'en',
            { query, tagSlug, sort }
        );
    }

    @Get('posts/:slug')
    async getPost(@Param('slug') slug: string, @Query('locale') locale?: string) {
        return this.cmsService.getPublicPostBySlug(slug, locale || 'en');
    }

    @Post('posts/:slug/view')
    async trackView(@Param('slug') slug: string) {
        return this.cmsService.trackPublicPostView(slug);
    }

    @Get('home')
    async home(
        @Query('locale') locale?: string,
        @Query('latestLimit') latestLimit?: number,
        @Query('hotTagLimit') hotTagLimit?: number,
        @Query('hotPostPerTag') hotPostPerTag?: number,
    ) {
        return this.cmsService.getPublicHome(
            locale || 'en',
            Number(latestLimit) || 6,
            Number(hotTagLimit) || 4,
            Number(hotPostPerTag) || 3,
        );
    }
}
