import { Controller, Get, Query } from '@nestjs/common';
import { CmsService } from './cms.service.js';

@Controller('cms')
export class CmsLinkPreviewController {
    constructor(private readonly cmsService: CmsService) { }

    @Get('link-preview')
    async getPreview(@Query('url') url: string) {
        return this.cmsService.getLinkPreview(url);
    }
}
