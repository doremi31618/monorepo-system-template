import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CmsService } from './cms.service.js';

@Controller('cms/tags')
export class CmsTagsController {
    constructor(private readonly cmsService: CmsService) { }

    @Get()
    async list(@Query('query') query?: string) {
        return this.cmsService.listTags(query);
    }

    @Post()
    async create(@Body() body: { name: string }) {
        return this.cmsService.createTag(body.name);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: { name?: string }) {
        return this.cmsService.updateTag(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.cmsService.deleteTag(id);
    }
}
