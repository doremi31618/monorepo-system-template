# `@platform/nest-infra-mcp-server`

**Framework：NestJS 10；Transport：MCP Streamable HTTP**

官方 MCP TypeScript SDK v2 的 Nest lifecycle adapter。它建立 stateless HTTP handler、在 app shutdown 時關閉 handler，並重匯出 OAuth resource-server helpers。此 package 不知道 CMS 或任何業務模組。

```ts
import { McpServer, NestMcpHttpService } from '@platform/nest-infra-mcp-server';

const handler = mcpHttp.createHandler(() => {
  const server = new McpServer({ name: 'my-server', version: '1.0.0' });
  server.registerTool('my_tool', { description: 'Example' }, async () => ({
    content: [{ type: 'text', text: 'ok' }],
  }));
  return server;
});
```

業務工具應在 `apps/api` composition root 註冊，直接呼叫 capability service；不要建立 `nest-<module>-mcp` package。完整流程見 `doc/onboarding/how-to-add-remote-mcp-tool.md`。
