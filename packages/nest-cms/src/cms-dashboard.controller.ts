import { Controller, Get, Query } from '@nestjs/common';
import { CmsService } from './cms.service.js';

@Controller('cms/dashboard')
export class CmsDashboardController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('analytics')
  async analytics(
    @Query('locale') locale?: string,
    @Query('days') days?: number,
    @Query('topLimit') topLimit?: number,
  ) {
    return this.cmsService.getDashboardAnalytics(
      locale || 'en',
      Number(days) || 14,
      Number(topLimit) || 5,
    );
  }
}
