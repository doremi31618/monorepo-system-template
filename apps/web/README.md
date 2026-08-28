# Web app

SvelteKit application for the platform. Reusable primitives come from `@platform/ui`; shared API types and clients come from `@platform/contracts` and `@platform/sdk`.

From the repository root:

```bash
bun install
bun run build:packages
bun run dev:web
bun run --filter @platform/web check
bun run --filter @platform/web build
```

Copy `apps/web/.env.example` to `apps/web/.env` and set `VITE_API_BASE_URL` when the API is not available at the default local URL. Build workspace packages before running the web-only check or build. Storybook is a separate application in `apps/storybook`.
