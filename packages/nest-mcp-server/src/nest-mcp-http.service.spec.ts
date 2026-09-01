import { McpServer } from '@modelcontextprotocol/server';
import { NestMcpHttpService } from './nest-mcp-http.service.js';

describe('NestMcpHttpService', () => {
  it('creates an Express-compatible handler without capability dependencies', () => {
    const service = new NestMcpHttpService();
    const handler = service.createHandler(
      () => new McpServer({ name: 'test', version: '1.0.0' }),
    );

    expect(typeof handler).toBe('function');
  });

  it('closes all managed handlers during application shutdown', async () => {
    const service = new NestMcpHttpService();
    service.createHandler(
      () => new McpServer({ name: 'test', version: '1.0.0' }),
    );

    await expect(service.onApplicationShutdown()).resolves.toBeUndefined();
  });
});
