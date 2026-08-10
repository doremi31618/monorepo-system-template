# monorepo-system-template

A capability-oriented full-stack platform built with SvelteKit, NestJS, Drizzle, PostgreSQL, and Bun workspaces.

## What is included

- Email/password and Google authentication, sessions, refresh rotation, and password reset
- Users and role-based access control
- Asset storage and CMS capabilities
- Reusable Svelte UI components, service showcase components, and Storybook
- Framework-neutral task execution primitives with package-owned unit tests
- One Drizzle migration history and a Docker development stack

## Repository layout

```text
apps/
├── api/          # NestJS composition root and HTTP API
├── web/          # SvelteKit routes and application UI
├── migrator/     # Canonical Drizzle configuration and migrations
└── storybook/    # UI development and documentation

packages/
├── contracts/    # Shared API types and validation contracts
├── sdk/          # Browser/API client helpers
├── ui/           # Packaged Svelte components
├── service-ui/   # Domain-neutral service catalog and status views
├── task-runtime/ # Framework-neutral task claiming and execution core
├── config/       # Typed application configuration
├── logger/       # Nest logger integration
├── database/     # Database factory and repository primitives
├── test-utils/   # Shared test helpers
├── users/
├── mail/
├── scheduling/
├── auth/
├── access-control/
├── assets/
└── cms/
```

Every internal dependency uses `workspace:*`. Packages expose ordinary `dist`-based package exports; no TypeScript path aliases or custom export conditions are required.

## Getting started

Requirements: Bun 1.3+, Node.js 22.12+ for the NestJS production runtime, and Docker when running the full local stack.

```bash
bun install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
bun run dev
```

Or start the full stack:

```bash
docker compose up --build
```

- Web: `http://localhost:5173`
- API: `http://localhost:3333/v1`
- OpenAPI: `http://localhost:3333/openapi`
- Storybook: `bun run --filter @platform/storybook dev`

## Common commands

```bash
bun run check
bun run test
bun run test:unit
bun run test:storybook
bun run build
bun run lint

bun run db:generate
bun run db:migrate
bun run db:studio
```

Drizzle migrations in `apps/migrator/drizzle` are the only canonical migration history. Feature packages own their schema definitions; the API composition root assembles them into one runtime schema.

See [capability-platform.md](doc/system-spec/architecture/capability-platform.md) for dependency rules,
[capability-migration-plan.md](doc/project-tasks/capability-migration-plan.md) for the cross-project
migration roadmap, and [how-to-start-dev-env.md](doc/onboarding/how-to-start-dev-env.md) for daily workflows.
