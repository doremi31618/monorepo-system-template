# 如何新增 Remote MCP Tool

本專案的 Remote MCP 與 REST 共用同一個 NestJS capability service。`@platform/nest-infra-mcp-server`
只處理 MCP protocol/HTTP lifecycle；業務 tool 在 `apps/api` composition root 註冊。不要建立
`nest-<capability>-mcp` package，也不要讓 capability 反向 import MCP。

## 現有 endpoints

| Endpoint       | 身分                                            | 資料權限               | 現有 tool                    |
| -------------- | ----------------------------------------------- | ---------------------- | ---------------------------- |
| `/mcp/public`  | 匿名                                            | 只讀 published summary | `cms_search_published_posts` |
| `/mcp/private` | OAuth，token audience 必須精確等於 endpoint URI | `cms.posts.read`       | `cms_search_posts`           |

兩者都是 stateless Streamable HTTP。文章只回傳 summary，不回傳 full body。

## 新增 tool 的順序

1. 在所屬 capability package 實作並匯出可重用 service method。REST controller 與 MCP 都呼叫它。
2. 如果 input/result 型別會被不同 framework 或多個模組共用，放入 framework-neutral core；Nest DTO、class-validator 留在 Nest adapter。
3. 在 `apps/api/src/mcp/mcp-composition.service.ts` 建立 Zod input schema 並呼叫 `server.registerTool(...)`。
4. 公開 tool 只能讀公開資料；private tool 必須在 `tools/list` 與每次 call 都檢查 RBAC。
5. 設定 read-only annotations，避免回傳 secret、credential、文章全文或 storage internal fields。
6. 補上真實 Streamable HTTP integration test、README 與 `bun run deps:check`。

最小註冊形狀：

```ts
server.registerTool(
  'module_action_resource',
  {
    description: '清楚描述資料範圍與不會做的事',
    inputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (input) => {
    const result = await capabilityService.search(input);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
);
```

## Private OAuth 設定

private resource URI 必須在部署後保持穩定，且以下三者完全相同：

- `MCP_PRIVATE_RESOURCE_URI`
- `OAUTH_DCR_RESOURCES` 中允許的 resource
- access token 的 `aud`

本機預設值是 `http://localhost:3333/mcp/private`。第一次使用前建立 resource：

```bash
bun run oauth-admin -- resource:create \
  --uri http://localhost:3333/mcp/private \
  --name "Private workspace MCP" \
  --scopes mcp:tools
```

OAuth scope `mcp:tools` 只代表 client/token 可進入 MCP resource；實際 CMS 資料授權仍由
`cms.posts.read` 決定。不要為每一個 CMS action 增加 OAuth scope。

`McpModule` 必須匯入 Nest `ConfigModule`，由 app-owned `apiEnvSchema` 驗證環境變數後，
再建立窄型別 `McpRuntimeConfig` 注入 token verifier 與 composition service。MCP service、
controller 與 package 不得直接讀取 `process.env`；新增設定時要同時更新
`apps/api/src/config/env.validation.ts` 與 `apps/api/.env.example`。

## Protocol smoke test

Public tool list：

```bash
curl -i http://localhost:3333/mcp/public \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Private endpoint 少了 token 時應回 `401`，且 `WWW-Authenticate` 含
`resource_metadata="http://localhost:3333/.well-known/oauth-protected-resource/mcp/private"`。

OpenAI release smoke 需驗證 Responses API Remote MCP 與 ChatGPT developer mode：public 能列出／
呼叫 tool，private 能完成 discovery、DCR、Authorization Code + PKCE、呼叫 tool。Claude Code
以 HTTP MCP endpoint 執行 public smoke；private OAuth 屬 best-effort，不阻擋本功能發布。

## 驗證命令

```bash
bun run --filter @platform/nest-infra-mcp-server test:unit
bun run --filter @platform/api test -- --runInBand src/mcp
bun run deps:check
bun run check
```
