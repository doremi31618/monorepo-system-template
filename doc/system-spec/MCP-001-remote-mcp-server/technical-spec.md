# Technical Specification: Remote MCP Server

> **Work Item ID**: MCP-001
> **Project Task**: `doc/project-tasks/MCP-001-remote-mcp-server-project-task.md`
> **Status**: Approved for implementation
> **Last updated**: 2026-09-01

## Architecture

```text
OpenAI / Claude / MCP client
             |
             v
apps/api (NestJS composition root)
  |-- /mcp/public  ---- no auth --------------------+
  |-- /mcp/private ---- OAuth JWT + RBAC -----------+--- app-owned tool mapping
             |                                      |
             v                                      v
@platform/nest-mcp-server                  @platform/nest-cms
  - MCP SDK v2 transport                     - CmsModule
  - server/tool registry                     - CmsService
  - HTTP/OAuth response helpers               - REST controllers/Drizzle adapter
                                                    |
                                                    v
                                             @platform/cms
                                               - framework-neutral queries/results
```

`apps/api` imports both Nest packages and registers handlers that call the injected `CmsService`. `@platform/nest-mcp-server` must never import CMS. There is no `@platform/nest-cms-mcp` package.

## Package migration

The current `@platform/cms` package hides NestJS dependencies. MCP-001 replaces that shape with:

- `@platform/cms`: framework-neutral search query/result interfaces and pure shared CMS utilities needed by more than one adapter.
- `@platform/nest-cms`: the existing schema, Drizzle-backed `CmsService`, Nest module/controllers, HTTP-specific exceptions and configuration integration. It implements/returns the framework-neutral public contracts where useful and exports `CmsService` for direct composition.

All API, migrator/schema-composition, tests, and workspace dependencies must use the new package paths. No compatibility alias is retained because the old name would continue hiding the framework constraint.

## MCP package API

`@platform/nest-mcp-server` exposes a small Nest-facing API:

- server metadata and tool-definition types;
- a factory/service that creates a stateless MCP server for one HTTP request;
- a controller/handler utility for Streamable HTTP POST requests;
- helpers for JSON-RPC method rejection and OAuth `WWW-Authenticate` challenges;
- protected-resource metadata types/helpers.

Tool definitions provide:

- stable name, description, input schema, and optional output schema;
- `readOnlyHint: true` for both CMS tools;
- an async handler returning structured content plus concise text fallback;
- optional authorization predicate evaluated during discovery and again during execution.

The package uses the official MCP TypeScript SDK v2 stable line and the 2026-07-28 protocol revision. HTTP handling is stateless so API replicas need no shared MCP session store. Unsupported methods receive the SDK/spec-defined response rather than creating a legacy SSE endpoint.

## Endpoint composition

### `/mcp/public`

For every request, the app creates a public server instance, registers `cms_search_published_posts`, connects a stateless Streamable HTTP transport, and lets the SDK process the request. The tool calls the framework-neutral `CmsService.searchPublished` capability method.

### `/mcp/private`

Before MCP dispatch, the app:

1. extracts the bearer token from the HTTP `Authorization` header;
2. verifies ES256 signature, issuer, expiry, and exact audience equal to the configured private MCP resource URI;
3. maps `sub` to a numeric platform user ID;
4. loads RBAC permissions;
5. creates the private MCP server with only tools the identity may use.

The execution handler repeats the permission check before calling `CmsService.searchWorkspace`; discovery filtering is not an authorization boundary by itself.

## OAuth discovery

The private endpoint returns a `401` challenge containing a `resource_metadata` URL. The API exposes RFC 9728 metadata with:

- `resource`: the canonical absolute `/mcp/private` URI;
- `authorization_servers`: the configured OAuth issuer;
- bearer-token transport support;
- the minimal generic MCP scope used by the existing OAuth resource registration.

The OAuth middleware in `apps/api/src/main.ts` must route only the authorization server's own well-known endpoints so the protected-resource metadata controller remains reachable.

No CMS-specific OAuth scope is introduced. OAuth decides whether the client has a token for the MCP resource; RBAC decides whether the identified platform user may read CMS workspace data.

## CMS tool contracts

### `cms_search_published_posts`

Input fields:

- `query?: string`
- `locale?: string` (default `en`)
- `tagSlug?: string`
- `sort?: "latest" | "popular"`
- `page?: integer >= 1`
- `limit?: bounded integer`

Output fields:

- `data[]`: `id`, `slug`, `title`, `excerpt`, `tags`, `coverImage`, `createdAt`, `updatedAt`, `publishedAt`
- `page`, `limit`, `total`

### `cms_search_posts`

Input fields:

- `query?: string`
- `locale?: string` (default `en`)
- `status?: "all" | "draft" | "published" | "archived"`
- `tagId?: string`
- `updatedFrom?: ISO date/date-time string`
- `updatedTo?: ISO date/date-time string`
- `page?: integer >= 1`
- `limit?: bounded integer`

Output fields:

- `data[]`: `id`, `slug`, `title`, `excerpt`, `tags`, `status`, `authorId`, `createdAt`, `updatedAt`, `publishedAt`
- `page`, `limit`, `total`

Dates are serialized as ISO strings at the MCP boundary. Full bodies and storage-internal fields are excluded.

## Security and privacy

- Tokens are accepted only from the HTTP Authorization header and never from query parameters.
- JWT verification requires the configured issuer, ES256, expiry, and exact private resource audience.
- Tokens, authorization codes, refresh tokens, and complete headers are never logged.
- Public queries hard-code the published status in the service/repository layer; client input cannot override it.
- Private handlers enforce `cms.posts.read` for both discovery and execution.
- Tool output is treated as untrusted content by clients; descriptions do not instruct the model to follow content-supplied commands.
- Pagination is bounded to limit data disclosure, latency, and token usage.

## Testing strategy

1. Unit-test framework-neutral query/result normalization and tool definitions.
2. Use an in-memory/fake CMS service to exercise MCP initialize, tools/list, and tools/call through the real stateless HTTP transport.
3. Test public access and published-only result shaping.
4. Test private missing token, invalid issuer/audience/signature, missing RBAC permission, and successful authorized calls.
5. Build every package and assert dependency direction from package manifests.
6. Document and, when environment access permits, run OpenAI Responses API, ChatGPT development-mode, and Claude Code smoke tests.

## Observability

Each MCP call logs endpoint class, tool name, outcome, duration, and authenticated subject ID when present. Arguments, results, article text, and credentials are not logged. Protocol validation/auth failures use stable reason codes suitable for later LLM-observer integration, but MCP-001 does not add a tracing backend.

## Rollback

MCP routes are isolated in the API composition and can be disabled through configuration or by removing `McpModule` from `AppModule`. REST CMS behavior remains independently composed. The package rename must be rolled back as one atomic code change; it has no database migration and does not alter stored CMS data.
