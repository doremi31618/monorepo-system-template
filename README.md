# monorepo-system-template

## Overview

Opinionated full-stack system template (SvelteKit + NestJS + Drizzle/PostgreSQL) with production-ready auth, Dockerized dev stack, and docs for extending into admin, CMS, and future modules. It ships end-to-end auth flows (email/password, Google SSO, password reset, session + refresh rotation) and serves as the foundation for the broader roadmap.

## Tech Stack

- Frontend: Svelte 5, SvelteKit, Tailwind CSS 4
- Backend: NestJS 10 (TypeScript), Drizzle ORM
- Database: PostgreSQL 16 (Dockerized)
- Tooling: Docker Compose for multi-service orchestration, ESLint/Prettier, TypeScript across the stack

## Current Features

- Email/password signup/login with session + refresh rotation and HttpOnly refresh cookie handling
- Logout and refresh endpoints that rotate tokens and clear cookies correctly
- Google OAuth login/signup (backend exchange + frontend callback storing session token)
- Password reset: request + confirm endpoints, SES email delivery, and wired frontend flows
- Auth-aware SvelteKit UI (login/signup/reset pages, guarded user layout) and token-aware HTTP client
- Drizzle ORM schemas and migration tooling with PostgreSQL via Docker Compose
- Swagger UI at `/openapi` and shared response envelope via NestJS filters/interceptors

## Repository Structure

- `frontend/` – SvelteKit app, UI components, API helpers, and stores
- `backend/` – NestJS service with modular architecture (`src/`), Drizzle schema, and migrations (`drizzle/`)
- `doc/` – Architecture notes and developer runbooks (`frontend-architect.md`, `how-to-start-dev-env.md`)
- `docker-compose.yml` – Spins up frontend, backend, and PostgreSQL for local development

## Getting Started

Step-by-step instructions for launching the development environment (Docker Compose, frontend-only, backend-only) live in `doc/onboarding/how-to-start-dev-env.md`.

Use Node.js 22.12+ or 24.x for local tooling. The repository includes `.nvmrc` so `nvm use` selects the tested baseline.

The short version:

```bash
cp backend/.env.example backend/.env   # first time only
docker compose up --build              # run everything
```

The frontend is available at `http://localhost:5173`, the backend API at `http://localhost:3333/v1`, Swagger at `http://localhost:3333/openapi`, and Postgres at `localhost:5432`.

## Additional Documentation

- Roadmap: `doc/Roadmap/overall-table.md` (Milestone 0 auth foundation → Milestone 1 core refactor → admin/CMS)
- Auth implementation/status: `doc/project-tasks/R0-auth-project-task.md`
- Core module WBS (Milestone 1): `doc/project-tasks/R1-core-project-task.md`
- Svelte architecture overview: `doc/system-spec/architecture/frontend-architect.md`
- Development environment guide: `doc/onboarding/how-to-start-dev-env.md`

Use these documents alongside this README to understand the design decisions and daily workflows in this project.
