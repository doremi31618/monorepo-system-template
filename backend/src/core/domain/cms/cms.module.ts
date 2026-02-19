import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller.js';
import { CmsDashboardController } from './cms-dashboard.controller.js';
import { CmsLinkPreviewController } from './cms-link-preview.controller.js';
import { CmsPublicController } from './cms-public.controller.js';
import { CmsTagsController } from './cms-tags.controller.js';
import { CmsService } from './cms.service.js';

@Module({
    controllers: [CmsController, CmsDashboardController, CmsTagsController, CmsLinkPreviewController, CmsPublicController],
    providers: [CmsService],
    exports: [CmsService],
})
export class CmsModule { }
