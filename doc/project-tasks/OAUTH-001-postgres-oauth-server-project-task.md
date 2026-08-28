# Postgres OAuth Server Project Task

> **Work Item ID**: OAUTH-001
> **Status**: Review
> **Actor**: Codex
> **Role**: Owner
> **Branch**: `feat/OAUTH-001-postgres-oauth-server`
> **Base**: `origin/dev` (`14c3b06`)
> **Worktree**: `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/OAUTH-001-postgres-oauth-server`
> **PR**: Pending
> **Related Spec**: `doc/system-spec/OAUTH-001-postgres-oauth-server/product-spec.md`, `doc/system-spec/OAUTH-001-postgres-oauth-server/technical-spec.md`
> **Release**: Pending
> **Last updated**: 2026-08-28

## Objective

Add a reusable, PostgreSQL-backed OAuth 2.1 and OpenID Connect authorization-server capability to the monorepo template. The capability will be the future identity source for Vocab and will also support MCP clients that use Dynamic Client Registration.

## Discovery / Shared Understanding

- **Mode**: Grill Me enabled
- **Gate status**: Approved
- **Approved at**: 2026-08-28
- **Summary**: Build `@platform/oauth-server` as a deep capability package. `apps/api` composes it, `apps/migrator` remains the only migration authority, and `apps/web` supplies login and consent interactions. Vocab remains out of this Work Item and may continue using Supabase for business data while trusting tokens issued by this server.
- **Key decisions**:
  - The authorization server will ultimately replace Clerk as Vocab's identity source, but no Vocab or user-data migration is included here.
  - Use Authorization Code with mandatory PKCE S256 and rotating refresh tokens; do not support password, implicit, or client-credentials grants.
  - Support pre-registered confidential clients and DCR-created public clients. DCR is configurable and may be disabled.
  - Access tokens are ES256 JWTs with one registered RFC 8707 resource audience. ID token audience is the client ID.
  - Use `oidc-provider` for protocol behavior and a custom Drizzle adapter for PostgreSQL persistence.
  - Reuse `@platform/auth` and `@platform/users` for email/password, Google login, password reset, and account claims.
  - Manage first-party clients and resources through a CLI; no admin UI is included.
- **Assumptions**:
  - Node.js 22 and the selected `oidc-provider` release are compatible with the NestJS Express composition root.
  - The existing auth capability can identify an authenticated user for an OAuth interaction without changing its externally visible login behavior.
- **Risks and acceptance**:
  - OAuth configuration, storage, redirect validation, and signing-key management are security-sensitive and require focused negative tests and independent review.
  - Live ChatGPT verification may be blocked by account/workspace policy; if so, the automated DCR flow remains required and the live gap must be recorded.
  - The Vocab repository contains a tracked environment-like file with credentials. It is outside this Work Item, but credentials must be removed and rotated before the later Vocab migration.

## Acceptance Criteria

- [x] A pre-registered confidential client completes Authorization Code + PKCE S256 and receives valid access, ID, and refresh tokens.
- [x] A public client can register through DCR and complete the same flow without a client secret.
- [x] Access tokens are ES256 JWTs with the expected issuer, subject, single resource audience, approved scopes, client ID, issue time, and expiry.
- [x] Refresh tokens rotate on every use; replaying an old refresh token revokes its token family.
- [x] Authorization codes are short-lived, hashed at rest, bound to the client, redirect URI, resource, and PKCE challenge, and consumable only once.
- [x] Discovery, JWKS, UserInfo, revocation, authorization, token, and registration endpoints expose the approved contracts.
- [ ] Consent is required for a new grant or wider scopes and is reused for an equal or narrower grant.
- [x] Email/password and Google authentication can resume the original authorization interaction.
- [x] Unknown clients/resources/scopes, mismatched redirect URIs, invalid secrets, missing or invalid PKCE, expired artifacts, and replays fail with safe standard errors.
- [x] The Drizzle adapter remains correct under multiple API instances and concurrent one-time-token consumption.
- [x] Client/resource CLI commands create, list, disable, and rotate the approved records without revealing stored secrets.
- [x] Unit, PostgreSQL integration, API E2E, typecheck, lint, and build checks pass.

## Scope

### In scope

- `@platform/oauth-server` package, NestJS module, protocol configuration, Drizzle schema and persistence adapter.
- OAuth/OIDC discovery, JWKS, authorization, token, DCR, revocation, and UserInfo behavior.
- Email/password and Google login integration plus SvelteKit consent/error UI.
- ES256 signing-key provider, resource/scope policy, rate limiting, audit events, and management CLI.
- Canonical Drizzle migration and automated tests.

### Out of scope

- Changes to the Vocab repository, Clerk migration, existing-user migration, or Vocab Supabase schema/RLS.
- Admin management UI, device flow, client credentials, resource-owner password grant, implicit flow, introspection, and DCR management protocol.
- Production release to `main` without separate Releaser approval.

## Required Tests

- [ ] Unit: resource/scope policy, redirect policy, claims, key selection, audit redaction, and CLI input validation.
- [ ] Adapter contract: every `oidc-provider` persistence model against an isolated PostgreSQL database.
- [ ] Integration: code consumption, refresh rotation/replay, grant/consent reuse, DCR restrictions, and concurrent calls.
- [ ] API E2E: discovery through token/UserInfo/revocation for confidential and DCR public clients.
- [ ] Web: login resume, consent approve/deny, invalid/expired interaction, responsive and accessible states.
- [ ] Manual: standard OIDC client and, when account access permits, ChatGPT/MCP DCR smoke test.
- [ ] Repository lint, typecheck, tests, build, and migration validation.

## Tasks

- [x] Requirements discovery and shared-understanding approval
- [x] Isolated feature worktree
- [x] Product and technical specifications
- [x] TDD implementation of persistence and policy slices
- [x] NestJS and database composition
- [x] SvelteKit interaction UI
- [x] CLI, security controls, and audit log
- [x] Complete verification
- [ ] Independent review and PR to `dev`
- [ ] `dev` integration
- [ ] Release note and release approval

## Decisions and Work Log

- 2026-08-28: Approved a package-first design with Drizzle/PostgreSQL persistence and app-level composition.
- 2026-08-28: Approved `oidc-provider` for protocol state transitions rather than implementing OAuth/OIDC RFC behavior from scratch.
- 2026-08-28: Approved confidential Vocab clients, public DCR clients, PKCE S256, rotating refresh tokens, ES256 JWTs, and single-resource audiences.
- 2026-08-28: Explicitly excluded Vocab code and data migration from this Work Item.
- 2026-08-28: Created the feature worktree from `origin/dev` at commit `14c3b06`.
- 2026-08-28: Kept `client_secret_basic` with hash-only storage by replacing the provider's public asynchronous `compareClientSecret` hook with scrypt verification; no reversible secret is persisted.
- 2026-08-28: Completed public-DCR and confidential-client protocol smoke flows, ES256 claim verification, refresh rotation/replay-family revocation, unsafe-DCR rejection, PKCE rejection, and raw-token-at-rest checks.

## Handoff

- **Commit/PR**: Pending
- **Branch/Worktree**: `feat/OAUTH-001-postgres-oauth-server` at `/Users/ericzhan/Documents/side-projects/monorepo-system-template-worktrees/OAUTH-001-postgres-oauth-server`
- **Validation**: `bun run test`, API/Web checks, lint, Drizzle generate/migrate, real PostgreSQL adapter concurrency, public/confidential end-to-end protocol smoke tests, JWT/JWKS verification, refresh replay, and negative DCR/PKCE tests passed. Repository-wide Prettier remains blocked by the repository's existing Svelte Prettier plugin `getVisitorKeys` failure and baseline formatting drift.
- **Known issues**: Live ChatGPT verification depends on external account/workspace access. Existing unrelated Web checks report 16 warnings; no Web type errors remain.
- **Next action**: Independent security/code review, then open a PR to `dev`.
