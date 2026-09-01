# Remote MCP Server Project Task

> **Work Item ID**: MCP-001
> **Status**: Review
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/MCP-001-remote-mcp-server`
> **Base**: `origin/main` (`d6900c2`)
> **Worktree**: `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/MCP-001-remote-mcp-server`
> **PR**: [#15](https://github.com/doremi31618/monorepo-system-template/pull/15)
> **Related Spec**: `doc/system-spec/MCP-001-remote-mcp-server/product-spec.md`, `doc/system-spec/MCP-001-remote-mcp-server/technical-spec.md`
> **Release**: Pending
> **Last updated**: 2026-09-01

## Objective

Add a reusable NestJS-first Remote MCP server capability and prove it with public and protected, read-only CMS search tools. The same CMS service must remain usable by the REST controllers and the MCP composition without creating a CMS-specific MCP package.

## Discovery / Shared Understanding

- **Mode**: Grill Me enabled
- **Gate status**: Approved
- **Approved at**: 2026-09-01
- **Summary**: Compose two standard Streamable HTTP MCP endpoints in `apps/api`: anonymous `/mcp/public` and OAuth-protected `/mcp/private`. Use CMS as the first real capability, keep `@platform/nest-mcp-server` independent from CMS, and let the app inject `CmsService` from `@platform/nest-cms` directly when registering tools.
- **Key decisions**:
  - OpenAI Responses API and ChatGPT development-mode connections are release-blocking targets; Claude Code is a non-blocking smoke-test target.
  - Public search exposes only published posts. Private search exposes every author and every existing status in the shared workspace when the authenticated user has `cms.posts.read`.
  - OAuth authenticates the private transport and binds its token audience. Existing RBAC, not a new CMS-specific OAuth scope, authorizes CMS data access.
  - Search results contain summaries only. Full-body reads and all writes are deferred.
  - Do not add `apps/mcp`, local/stdio MCP, or `@platform/nest-cms-mcp`.
  - `apps/api` is the composition root. It imports the generic MCP adapter and `@platform/nest-cms`, injects `CmsService`, and registers the tool handlers.
  - Split the current misleading `@platform/cms` package so Nest-specific controllers, module, service, HTTP DTOs, and validation live in `@platform/nest-cms`; keep only genuine framework-neutral CMS contracts or pure logic in `@platform/cms`.
- **Assumptions**:
  - The current OAuth server remains the authorization server for `/mcp/private` and continues to issue ES256 JWT access tokens with RFC 8707 resource audiences.
  - ChatGPT workspace/account policy may determine whether a live development-mode connector can be exercised locally.
- **Risks and acceptance**:
  - The official MCP TypeScript SDK v2 is new. Pin a stable release, hide it behind `@platform/nest-mcp-server`, and cover the public transport contract with integration tests.
  - Renaming/splitting CMS affects imports across API, schema composition, migrator, and tests. Every workspace import and build order must be verified.
  - Live OpenAI or Claude verification may require account access and a public HTTPS URL. Automated protocol tests remain mandatory, and unavailable live checks must be recorded rather than claimed.

## Acceptance Criteria

- [x] `POST /mcp/public` is a standard stateless Streamable HTTP MCP endpoint and lists/calls `cms_search_published_posts` without authentication.
- [x] Public search supports keyword, locale, tag slug, sort, page, and limit while returning published summaries only.
- [x] `POST /mcp/private` challenges missing/invalid bearer credentials with standard OAuth protected-resource metadata.
- [x] A valid audience-bound OAuth access token identifies the user, and `cms_search_posts` is available only when that user has `cms.posts.read`.
- [x] Private search supports keyword, locale, status, tag, updated range, page, and limit and returns summaries for all authors/statuses in the shared workspace.
- [x] Both tools advertise read-only behavior and return concise structured results without full article bodies.
- [x] `@platform/nest-mcp-server` has no dependency on CMS; no `nest-cms-mcp` package or separate MCP app is introduced.
- [x] `@platform/nest-cms` exports `CmsModule` and `CmsService`; `apps/api` injects that service directly for REST and MCP composition.
- [x] All renamed CMS imports, schema exports, build order, README files, dependency documentation, and onboarding instructions are updated.
- [x] OpenAI Responses API and ChatGPT development-mode smoke-test instructions exist; automated protocol/security tests pass.
- [x] Claude Code public smoke-test instructions exist; live vendor execution is recorded as unavailable without a reachable HTTPS deployment/account access.

## Scope

### In scope

- `@platform/nest-mcp-server`, standard Streamable HTTP handling, registry/server factory, endpoint error mapping, and protected-resource metadata helpers.
- `@platform/cms` framework-neutral query/result contracts and `@platform/nest-cms` Nest/Drizzle implementation.
- App-level CMS tool registration, OAuth JWT validation, RBAC authorization, and public/private endpoints.
- Unit, integration/E2E, package boundary, and documentation updates.

### Out of scope

- Local/stdio MCP, a separately deployed MCP app, SSE compatibility, WebSocket transport, resources/prompts, or MCP Apps UI.
- CMS create/update/publish/delete tools or a full-body read tool.
- ChatGPT/Anthropic directory publication.
- Per-author, department, tenant, or row-level data isolation.
- LLM observer work and unrelated SSO expansion.

## Required Tests

- [x] Unit: framework-neutral CMS contracts/mappers, MCP tool registration, auth challenge helpers, and permission policy.
- [x] Integration/E2E: initialize, tools/list, public call, private 401, invalid audience, missing RBAC permission, and successful private call.
- [x] Package boundaries: no CMS dependency from `nest-mcp-server`; all renamed package imports resolve from built output.
- [ ] Manual: OpenAI Responses API, ChatGPT development mode, and non-blocking Claude Code smoke instructions/results.
- [x] Repository lint, typecheck/check, unit tests, API tests, Storybook browser tests, and build.

## Tasks

- [x] Requirements discovery and shared-understanding approval
- [x] Preflight and isolated feature worktree
- [x] Product and technical specifications
- [x] Split CMS core and Nest adapter packages
- [x] Implement generic Nest Remote MCP package
- [x] Compose public/private CMS tools and authorization
- [x] Tests and package-boundary validation
- [x] README, dependency graph, and onboarding updates
- [ ] Independent review and PR ([#15](https://github.com/doremi31618/monorepo-system-template/pull/15))
- [ ] Release note and release approval

## Decisions and Work Log

- 2026-09-01: Approved two endpoints: anonymous `/mcp/public` and protected `/mcp/private`.
- 2026-09-01: Approved workspace-wide private CMS visibility behind `cms.posts.read`; deferred finer data scopes.
- 2026-09-01: Approved OpenAI Responses API plus ChatGPT development mode as release gates and Claude as non-blocking.
- 2026-09-01: Approved direct injection of `@platform/nest-cms` `CmsService` from `apps/api`; explicitly rejected a `nest-cms-mcp` package.
- 2026-09-01: Used `origin/main` as the project-specific base because `origin/dev` has no unique commits, is nine commits behind `origin/main`, and the repository coding standard now defines `main` as canonical.
- 2026-09-01: Selected the official MCP TypeScript SDK v2 stable line for the 2026-07-28 protocol revision.
- 2026-09-01: Added `@platform/cms` framework-neutral contracts, `@platform/nest-cms`, generic `@platform/nest-mcp-server`, and app-owned public/private CMS tool registration.
- 2026-09-01: Added `deps:check`/`deps:graph`; all 19 packages now have a README with framework/runtime labels and usage guidance.
- 2026-09-01: Full Nest smoke verified public tools/list, private `401` resource challenge, and unwrapped RFC 9728 metadata against an isolated migrated PostgreSQL database.
- 2026-09-01: Live OpenAI/ChatGPT/Claude vendor smoke not executed because this worktree has no reachable HTTPS deployment or authenticated vendor workspace; exact manual steps are documented for release validation.
- 2026-09-01: Opened feature integration PR [#15](https://github.com/doremi31618/monorepo-system-template/pull/15) targeting `dev`.

## Handoff

- **Commit/PR**: `2ce671e` / [#15](https://github.com/doremi31618/monorepo-system-template/pull/15)
- **Branch/Worktree**: `feat/MCP-001-remote-mcp-server` at `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/MCP-001-remote-mcp-server`
- **Validation**: `bun run check`, `bun run test` (isolated PostgreSQL), `bun run lint`, `bun run deps:check`, API MCP 13-test suite, real Nest app HTTP smoke, and `git diff --check` pass. Existing Web checks/lint retain 16/24 non-blocking baseline warnings and no errors.
- **Known issues**: Live vendor smoke tests require reachable HTTPS and suitable account/workspace access; the manual release gate remains open. Existing legacy Nest packages without a `nest-` prefix are documented migration debt; all newly split framework-bound packages follow the naming rule.
- **Next action**: Review the branch, run OpenAI/ChatGPT live smoke on a reachable deployment, then open the PR and approve release.
