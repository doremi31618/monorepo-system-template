# Product Specification: Remote MCP Server

> **Work Item ID**: MCP-001
> **Project Task**: `doc/project-tasks/MCP-001-remote-mcp-server-project-task.md`
> **Status**: Approved for implementation
> **Last updated**: 2026-09-01

## Purpose

Allow AI clients to discover and call platform capabilities through the open Model Context Protocol without rewriting those capabilities for each vendor. CMS is the first reference capability because it already has useful public and workspace-private read paths.

## Users and scenarios

- A visitor connects an AI client to the public MCP endpoint and searches published CMS posts without signing in.
- A workspace member connects the protected endpoint, completes OAuth login, and searches all CMS post statuses when their account has `cms.posts.read`.
- A platform developer adds another MCP tool by composing an existing Nest capability service in `apps/api`, without modifying the generic MCP package.

## Core behavior

### Public server

- Endpoint: `/mcp/public`.
- Authentication: none.
- Tool: `cms_search_published_posts`.
- Filters: keyword, locale, tag slug, latest/popular sort, page, and limit.
- Results: post ID, slug, title, excerpt, tags, timestamps, and public URL/cover metadata where available. Every result is published.

### Private server

- Endpoint: `/mcp/private`.
- Authentication: OAuth bearer access token issued for this exact resource audience.
- Authorization: the token subject must map to a platform user with `cms.posts.read`.
- Tool: `cms_search_posts`.
- Filters: keyword, locale, status, tag ID, updated-from/to, page, and limit.
- Results: post ID, slug, title, excerpt, tags, status, author ID, and timestamps. Results span the shared workspace rather than only the current author.

### Result limits

- Search is paginated and bounded; implementations choose conservative defaults and a documented maximum.
- Search results never include a complete article body.
- Empty result sets are successful responses with an empty data array and pagination metadata.

## Success criteria

- OpenAI Responses API can list and call both endpoints, providing an OAuth token for the private endpoint.
- ChatGPT development mode can connect to both endpoints and complete the private login flow.
- A standard MCP client receives protocol-compliant initialize, list, call, error, and authorization behavior.
- Claude Code can call the public server in a non-blocking smoke test when a reachable URL is available.

## Product boundaries

- The first release is read-only.
- No MCP-specific CMS service or package is created.
- No local MCP process, custom UI, public marketplace submission, or alternate data-scope model is included.
- REST behavior remains available and continues to use the same Nest CMS service.

## Error behavior

- Invalid tool inputs return a safe MCP invalid-params/tool error without internal stack details.
- Missing or invalid private credentials return HTTP `401` with a discoverable OAuth challenge.
- An authenticated user without `cms.posts.read` cannot discover or call the private CMS tool; direct attempts are denied safely.
- Database and internal failures return a generic tool failure and are logged through the platform logger without tokens or credentials.
