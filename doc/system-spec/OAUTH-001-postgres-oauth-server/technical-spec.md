# Technical Specification: Postgres OAuth Server

> **Work Item ID**: OAUTH-001
> **Project Task**: `doc/project-tasks/OAUTH-001-postgres-oauth-server-project-task.md`
> **Status**: Approved for implementation
> **Last updated**: 2026-08-28

## Architecture

```text
Vocab / MCP client
       |
       v
apps/api (NestJS composition root)
       |
       v
@platform/nest-infra-oauth-server
  - oidc-provider protocol engine
  - platform policy and interactions
  - Drizzle persistence adapter
       |
       +------> @platform/nest-identity-auth + @platform/nest-identity-users
       |
       v
PostgreSQL

apps/web       -> login, consent, and interaction error UI
apps/migrator  -> canonical Drizzle migration history
```

`@platform/nest-infra-oauth-server` owns the capability implementation and exposes provider factories, policy/services, the Drizzle adapter, and schema exports. `apps/api` owns the NestJS composition module and must not reimplement protocol behavior.

## External endpoints

| Method | Path                                      | Purpose                                             |
| ------ | ----------------------------------------- | --------------------------------------------------- |
| GET    | `/.well-known/oauth-authorization-server` | RFC 8414 metadata                                   |
| GET    | `/.well-known/openid-configuration`       | OIDC discovery                                      |
| GET    | `/.well-known/jwks.json`                  | Current and previous ES256 public keys              |
| GET    | `/oauth/authorize`                        | Authorization Code request and interaction creation |
| POST   | `/oauth/token`                            | Code exchange and refresh rotation                  |
| POST   | `/oauth/register`                         | Restricted public-client DCR                        |
| POST   | `/oauth/revoke`                           | Revoke a refresh token/grant                        |
| GET    | `/oauth/userinfo`                         | Claims permitted by token scopes                    |

OAuth/OIDC responses bypass the platform's ordinary response envelope because their wire formats and cache headers are externally standardized.

## Protocol configuration

- Response type: `code` only.
- Grant types: `authorization_code`, `refresh_token`.
- PKCE: required for every client; method `S256` only.
- Public token authentication: `none`.
- Confidential token authentication: `client_secret_basic`.
- Access/ID token signing: ES256 with unique `kid`.
- Access token TTL: 900 seconds.
- Authorization code TTL: 300 seconds.
- Refresh-token absolute TTL: 30 days with rotation and family replay revocation.
- Resource indicator: one registered absolute URI; access token `aud` equals the approved resource.
- ID token `aud`: OAuth client ID.
- DCR: configurable, public clients only, no registration-management protocol.

## Persistence

The package implements the complete `oidc-provider` adapter contract with Drizzle. The exact model rows are selected to match the library contract while maintaining security invariants. Feature-owned tables include:

- `oauth_artifacts`: hashed protocol identifiers and serialized provider payloads, keyed by model and identifier hash, with grant/user/session indexes, expiration, and an atomic consumed timestamp. Bearer-model `jti` values are removed from JSON payloads and reconstructed only from the presented token.
- `oauth_clients`: first-party and DCR client metadata, status, secret hash, and timestamps.
- `oauth_resources`: resource URI, allowed scopes, status, and timestamps.
- `oauth_consents`: user/client/resource approved scopes and revocation state.
- `oauth_audit_events`: redacted security and lifecycle events.
- `oauth_rate_limits`: distributed fixed-window counters for DCR, token, and login endpoints.
- `oauth_signing_keys`: public-key lifecycle metadata only; signing private keys never enter PostgreSQL.

Schema names may be consolidated when the adapter contract proves a smaller model through TDD. The externally observable invariants are authoritative, not this preliminary table count.

Every one-time consume and refresh rotation uses atomic PostgreSQL operations or transactions so multiple API replicas cannot redeem the same artifact successfully.

## Security rules

### Redirects and DCR

- Redirect URIs are absolute and contain no fragment, wildcard, or userinfo.
- Production redirects use HTTPS. Loopback HTTP is allowed only for localhost/127.0.0.1 development callbacks.
- The callback must exactly match a registered URI.
- DCR clients are public, use `none`, request code/refresh grants, and use PKCE S256.
- DCR may be disabled and is rate limited to 10 registrations per IP per hour by default. Token exchange defaults to 120 requests per IP per minute, and platform login defaults to 10 attempts per IP per minute.

### Secrets and tokens

- Client secrets, authorization codes, and refresh tokens are never logged and are stored only as hashes where platform-managed storage permits.
- Access and ID tokens are short-lived signed JWTs.
- Signing private keys are supplied through a `SigningKeyProvider`; PostgreSQL never stores plaintext private keys.
- Production startup fails when signing-key configuration is missing or invalid.
- Current and previous public keys remain in JWKS long enough to validate unexpired tokens.

### Audit and errors

- Audit events cover registration, authorization approval/denial, issuance, refresh, replay, revocation, client management, and policy failures.
- Logs may contain user/client IDs and an IP hash, but not credentials or complete tokens.
- Protocol endpoints return standard OAuth/OIDC errors and no internal stack or database details.
- DCR and token endpoints apply configurable IP/client limits; existing login behavior gains a failed-attempt limit without account enumeration.

## Accounts and interactions

`@platform/nest-infra-oauth-server` depends on public interfaces from `@platform/nest-identity-auth` and `@platform/nest-identity-users` to:

- validate the existing platform session during an interaction;
- load `sub`, email, email-verification state, and profile claims;
- resume the interaction after email/password or Google login.

`apps/web` receives an opaque interaction ID. It fetches safe interaction details, renders consent, and submits approve/deny. It never receives authorization codes or tokens except through the registered client callback.

## CLI

The package exposes command operations; an app-level script composes database/config dependencies. Required operations:

- create/list/disable resources;
- create/list/disable confidential clients;
- rotate a confidential client secret.

Generated client secrets are displayed once. Only a salted scrypt hash is persisted. The provider's public asynchronous client-secret comparison hook verifies that hash while retaining standard `client_secret_basic` on the wire.

## Testing strategy

Tests use the public module/adapter interfaces and real PostgreSQL where persistence semantics matter. TDD proceeds in vertical slices:

1. Drizzle adapter persistence, lookup, expiry, consume, revoke, and concurrency.
2. Resource/scope/client policy and DCR restrictions.
3. Provider discovery and signed-token claims.
4. Authorization interaction and consent reuse.
5. Code exchange, refresh rotation/replay, UserInfo, and revocation.
6. CLI and UI flows.

External live ChatGPT verification is manual; all protocol behavior required for DCR remains automated.

## Rollback

The feature remains isolated behind module composition and configuration. Before release, rollback consists of removing `OAuthServerModule` from the app composition and retaining unused OAuth tables. Dropping tables or keys is a separate destructive migration and is not part of an emergency rollback.
