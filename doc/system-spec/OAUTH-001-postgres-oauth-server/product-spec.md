# Product Specification: Postgres OAuth Server

> **Work Item ID**: OAUTH-001
> **Project Task**: `doc/project-tasks/OAUTH-001-postgres-oauth-server-project-task.md`
> **Status**: Approved for implementation
> **Last updated**: 2026-08-28

## Purpose

Provide one platform-owned identity and authorization server that future applications can trust without binding those applications to Supabase Auth, Clerk, or another hosted identity provider. Vocab is the first planned client; MCP clients are the second supported scenario.

## Users and scenarios

### Vocab user

1. Vocab redirects the browser to the platform authorization endpoint with a registered callback, resource, scopes, state, nonce, and PKCE challenge.
2. The user signs in with email/password or Google.
3. The user reviews and approves the requested Vocab access.
4. Vocab exchanges the one-time code and validates the returned ID/access tokens.
5. Vocab continues storing business data in its independently managed Supabase PostgreSQL database.

### MCP user

1. An MCP client discovers the server metadata and dynamically registers as a public client.
2. The client starts Authorization Code + PKCE for a registered MCP resource.
3. The user signs in and approves `mcp:tools` access.
4. The MCP resource server validates the ES256 token locally through JWKS.

### Platform operator

The operator uses a CLI to register and disable resources and first-party clients, rotate client secrets, and inspect non-secret metadata. Signing keys remain deployment secrets.

## Product behavior

- A user always sees consent for the first grant to a client/resource or when requested scopes expand.
- An existing consent may skip the consent screen when the request is equal or narrower.
- The consent screen identifies the client, callback host, target resource, and human-readable requested permissions.
- Denial returns the client to its registered callback with `access_denied` and the original state.
- Invalid or expired interactions render a safe terminal error page.
- A client receives an access token for only one target resource. A Vocab token cannot be used at MCP and vice versa.
- Refreshing rotates the refresh token. Reuse of a rotated token terminates that login grant.
- Users and operators can revoke future access without requiring business-data migration.

## Initial scopes

| Scope            | Meaning                                        |
| ---------------- | ---------------------------------------------- |
| `openid`         | Request an OpenID Connect identity token.      |
| `email`          | Read the account email and verification state. |
| `profile`        | Read basic profile claims.                     |
| `offline_access` | Allow refresh tokens for continued access.     |
| `vocab:read`     | Read the user's Vocab resources.               |
| `vocab:write`    | Create or change the user's Vocab resources.   |
| `mcp:tools`      | Invoke approved tools at the MCP resource.     |

Clients and resources have explicit allowlists. The server rejects an unknown or disallowed combination.

## Interaction requirements

- Reuse existing platform UI primitives and visual language.
- Support keyboard operation, visible focus, semantic labels, screen-reader error announcements, mobile width, and loading/disabled states.
- Never render tokens, client secrets, PKCE verifiers, signing keys, or internal exceptions.
- Preserve the pending authorization interaction through platform login and Google redirects.

## Acceptance authority

The acceptance criteria and test requirements in `doc/project-tasks/OAUTH-001-postgres-oauth-server-project-task.md` are authoritative for OAUTH-001.
