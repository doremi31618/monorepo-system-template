# Capability platform architecture

## Principles

1. `apps/*` are composition roots and deployable processes.
2. `packages/*` own reusable capabilities and infrastructure primitives.
3. Dependencies point in one direction and are declared with `workspace:*`.
4. Packages expose compiled `dist` output through standard Node/Svelte exports.
5. NestJS runs on Node.js in production; Bun manages workspaces and tasks.
6. Drizzle is the only migration authority.

## Dependency direction

```text
contracts   config   database   logger   ui   test-utils
    │          │         │         │
    ├──────────┴────┐    │         │
    ▼               ▼    ▼         │
  users            mail  scheduling│
    │                │      │       │
    └──────────────► auth ◄─────────┘
                       │
                       ▼
                access-control

users ───────────────► assets
users + assets ───────► cms
```

Applications choose capabilities:

```text
apps/api        -> all server capabilities + schema composition
apps/web        -> contracts + sdk + ui
apps/migrator   -> feature-owned schemas + one migration history
apps/storybook  -> ui
```

## Database seam

Feature packages own table definitions. `@platform/database` deliberately does not import feature schemas; it only exposes the pool/database factory and repository base class. `apps/api/src/core/infra/db/schema.ts` composes the runtime schema, which prevents `database -> feature -> database` cycles.

`apps/migrator/drizzle.config.ts` scans capability-owned schemas and writes migrations only to `apps/migrator/drizzle`.

## Package boundary rule

- A capability may import another capability only when the dependency direction above allows it.
- A package must never import from `apps/*`.
- Routes remain in `apps/web`; reusable Svelte components remain in `packages/ui`.
- Platform adapters are selected by an app. A future alternate storage provider should be a separate adapter package rather than hard-coded into unrelated capabilities.

## Decisions made during the first extraction

- `worker` is not scaffolded yet. Scheduling remains a capability composed by the API until a real independently deployed background workload exists.
- `playground` is not scaffolded yet. Storybook already provides the useful isolated UI development surface.
- No `supabase/` migration tree is created. The current platform uses PostgreSQL/MinIO and keeps Drizzle as the single migration authority; an unused second history would create ambiguity.
- Capability modules use explicit workspace dependencies for this first extraction. Introduce `register(...)`/provider tokens when a capability gains a second adapter or needs to be consumed outside this workspace, rather than adding configuration indirection pre-emptively.
- Node.js remains the API production runtime. Bun owns dependency installation, workspace resolution, and task execution.
