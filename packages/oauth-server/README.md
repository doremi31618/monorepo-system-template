# `@platform/oauth-server`

Reusable OAuth 2.1 and OpenID Connect authorization-server capability backed by PostgreSQL and Drizzle ORM. `apps/api` composes the provider with platform users/authentication; `apps/web` renders login and consent.

## Runtime configuration

- `OAUTH_ISSUER`: public issuer origin, for example `https://auth.example.com`.
- `OAUTH_PRIVATE_JWKS`: private ES256 JWKS JSON. Include the active key and any still-valid previous signing keys. Required in production; development may use an ephemeral key.
- `OAUTH_DCR_ENABLED`: enable restricted public-client DCR.
- `OAUTH_DCR_RESOURCES`: comma-separated resource allowlist assigned to DCR clients.
- `OAUTH_DCR_SCOPES`: comma-separated scope allowlist assigned to DCR clients.
- `OAUTH_DCR_RATE_LIMIT`, `OAUTH_DCR_RATE_WINDOW_SECONDS`, `OAUTH_TOKEN_RATE_LIMIT`, `AUTH_LOGIN_RATE_LIMIT`: distributed PostgreSQL-backed limits.

Run the canonical Drizzle migration before starting the API:

```sh
bun run db:migrate
```

## Operator CLI

The CLI reads `DATABASE_URL`. Comma-separate lists without spaces, or quote the value.

```sh
bun run oauth-admin -- resource:create \
  --uri https://vocab.example/api \
  --name "Vocab API" \
  --scopes vocab:read,vocab:write

bun run oauth-admin -- client:create \
  --id vocab-web \
  --name Vocab \
  --type confidential \
  --redirect-uris https://vocab.example/auth/callback \
  --scopes openid,email,profile,offline_access,vocab:read,vocab:write \
  --resources https://vocab.example/api

bun run oauth-admin -- resource:list
bun run oauth-admin -- client:list
bun run oauth-admin -- client:rotate-secret --id vocab-web
bun run oauth-admin -- client:disable --id vocab-web
bun run oauth-admin -- resource:disable --uri https://vocab.example/api
```

Client creation and rotation print a secret once. PostgreSQL stores only the salted scrypt hash.
