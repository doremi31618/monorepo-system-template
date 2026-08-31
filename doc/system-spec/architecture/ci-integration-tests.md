# CI Integration Test Database

> **Work Item ID**: CI-001  
> **Status**: Review  
> **Last updated**: 2026-08-31

## Purpose

The repository CI must provide the infrastructure required by package integration tests. PostgreSQL-backed tests must not silently depend on a developer machine or an external shared database.

## Runtime Flow

1. GitHub Actions starts an ephemeral PostgreSQL 16 service and waits for it to become healthy.
2. `DATABASE_URL` points the canonical migrator at the CI database.
3. `bun run db:migrate` applies the repository's Drizzle migrations before tests start.
4. `TEST_DATABASE_URL` points PostgreSQL integration tests at the same isolated CI database.
5. GitHub Actions removes the service after the job finishes.

`DATABASE_URL` and `TEST_DATABASE_URL` intentionally have the same value in CI but represent different responsibilities: migration/runtime configuration and test-only database access. Keeping both explicit prevents either consumer from falling back to a local default.

## Constraints

- CI uses temporary credentials and a job-scoped database; these values are not production secrets.
- CI must not connect to development, staging, or production databases.
- Schema setup stays owned by `apps/migrator`; packages must not create tables themselves.
- Integration tests may clean their own records and therefore require an isolated database.

## Acceptance Criteria

- A clean CI runner can migrate the database without manual preparation.
- PostgreSQL-backed OAuth integration tests pass on pull requests and pushes to `main`.
- Repository check, test, and build commands continue to run after migration.

## Related Work

- Project task: `doc/project-tasks/CI-001-postgres-integration-tests-project-task.md`
- Workflow: `.github/workflows/ci.yml`
