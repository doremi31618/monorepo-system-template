# API app

NestJS HTTP composition root for the platform.

Business capabilities live in `packages/*`; this app wires them together, owns HTTP-wide concerns, and composes the Drizzle schema in `src/core/infra/db/schema.ts`.

From the repository root:

```bash
bun install
bun run dev:api
bun run --filter @platform/api test
bun run --filter @platform/api build
```

Copy `apps/api/.env.example` to `apps/api/.env` before starting the app. OpenAPI is served at `/openapi`.

Database migrations are intentionally not owned here. Use the root `bun run db:*` commands, which delegate to `apps/migrator`.
