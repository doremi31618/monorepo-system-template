# Web app

SvelteKit application for the platform. Reusable primitives come from `@platform/ui`; shared API types and clients come from `@platform/contracts` and `@platform/sdk`.

From the repository root:

```bash
bun install
bun run dev:web
bun run --filter @platform/web check
bun run --filter @platform/web build
```

Set `VITE_API_BASE_URL` in `apps/web/.env` when the API is not available at the default local URL. Storybook is a separate application in `apps/storybook`.
