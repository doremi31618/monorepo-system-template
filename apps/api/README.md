# API app

NestJS HTTP composition root for the platform.

Business capabilities live in `packages/*`; this app wires them together, owns HTTP-wide concerns, composes the Drizzle schema in `src/core/infra/db/schema.ts`, and owns the repository's single migration history in `db/migrations`.

From the repository root:

```bash
bun install
bun run dev:api
bun run --filter @platform/api test
bun run --filter @platform/api build
```

Copy `apps/api/.env.example` to `apps/api/.env` before starting the app. OpenAPI is served at `/openapi`.

`src/config/env.validation.ts` is the authoritative API environment contract.
`.env.example` intentionally contains the same key set, and a unit test prevents
the schema and example from drifting apart. `API_BASE_URL` is the server origin
used for startup output; `HOST_URL` includes the `/v1` prefix and is used when
the API creates callback or asset URLs.

## Default API user

After copying `.env.example`, the API seeds this local/test root administrator when it starts:

```text
Email: admin@example.com
Password: change-me-admin-password
```

These values come from `ROOT_ADMIN_EMAIL` and `ROOT_ADMIN_PASSWORD`. They are intended for local development and testing only; set unique credentials in production.

Use the root `bun run db:*` commands for schema changes. They delegate to this app's Drizzle tooling, but migrations remain an explicit deployment step and never run automatically during API bootstrap.
