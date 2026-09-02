import { Module } from '@nestjs/common';
import { NestMcpHttpService } from './nest-mcp-http.service.js';

@Module({
  providers: [NestMcpHttpService],
  exports: [NestMcpHttpService],
})
export class NestMcpServerModule {}
