# Project Architecture Overview

本文件說明 `monorepo-system-template` 目前的 capability-oriented Bun monorepo。

## 1. Monorepo structure

```text
monorepo-system-template/
├── apps/
│   ├── api/           NestJS REST API composition root
│   ├── migrator/      Canonical Drizzle migration history
│   ├── storybook/     Package-owned UI story host
│   └── web/           SvelteKit web application
├── packages/
│   ├── contracts/     Shared API types and constants
│   ├── sdk/           Browser-facing API client
│   ├── ui/            Primitive Svelte components
│   ├── service-ui/    Domain-neutral service presentation
│   ├── task-runtime/  Framework-neutral task runtime
│   └── ...            Backend capability and infrastructure packages
├── doc/               Roadmap, project tasks, specs, and onboarding
├── scripts/           Repository automation
├── SQLScripts/        Historical or auxiliary SQL
├── docker-compose.yml Local web, API, PostgreSQL, and MinIO services
└── package.json       Bun workspace and root task contract
```

`apps/*` are deployable composition roots. `packages/*` own reusable capabilities and must not import from `apps/*`. The detailed dependency direction is documented in [Capability platform architecture](./capability-platform.md).

## 2. Runtime topology

```text
Browser → SvelteKit apps/web → NestJS apps/api → Drizzle → PostgreSQL
                                      └────────→ MinIO/S3-compatible storage
```

- `apps/web` consumes `packages/contracts`, `packages/sdk`, `packages/ui`, and `packages/service-ui`.
- `apps/api` composes backend capability packages and infrastructure adapters.
- `apps/migrator` is the only migration authority for the platform database.
- `apps/storybook` discovers package-owned stories and runs visual/accessibility checks.

## 3. Toolchain

| Area | Current baseline |
| --- | --- |
| Runtime/package manager | Node.js `>=22.12 <27`, Bun `>=1.3 <2` |
| Frontend | SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, Bits UI |
| Backend | NestJS 10, Drizzle ORM, PostgreSQL 16 |
| Storage | MinIO locally; S3-compatible adapter boundary |
| Quality | ESLint, Prettier, unit tests, Svelte Check, Storybook browser tests |

## 4. Ownership boundaries

- SvelteKit routes and app-specific features remain in `apps/web/src`.
- Primitive UI belongs in `packages/ui`; reusable service presentation belongs in `packages/service-ui`.
- Framework-neutral task behavior belongs in `packages/task-runtime`.
- Backend capabilities own their services, repositories, and schemas; `apps/api` only composes them.
- Shared request/response and permission types belong in `packages/contracts`.
- Active work and acceptance status belong in `doc/project-tasks`; product and technical designs belong in `doc/system-spec`.

## 5. Common workflows

```bash
bun install --frozen-lockfile
bun run build:packages
bun run dev
bun run check
bun run test
bun run build
```

Database migration:

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

## 6. Related documentation

- [Start development environment](../../onboarding/how-to-start-dev-env.md)
- [Frontend architecture](./frontend-architect.md)
- [Backend architecture](./backend-architect.md)
- [Capability platform architecture](./capability-platform.md)
- [Frontend onboarding](../../onboarding/frontend-onboarding.md)
- [Backend onboarding](../../onboarding/backend-onboarding.md)
- [Capability migration plan](../../project-tasks/capability-migration-plan.md)
