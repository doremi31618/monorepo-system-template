# PostgreSQL Integration Tests in CI Project Task

> **Work Item ID**: CI-001  
> **Status**: Review  
> **Actor**: Codex  
> **Role**: Owner  
> **Branch**: `hotfix/CI-001-postgres-integration-tests`  
> **Base**: `main` (`71cdd45`)  
> **Worktree**: `/Users/ericzhan/Documents/SIRAYA-project/monorepo-system-template`  
> **PR**: [#14](https://github.com/doremi31618/monorepo-system-template/pull/14)  
> **Related Spec**: `doc/system-spec/architecture/ci-integration-tests.md`  
> **Release**: Pending  
> **Last updated**: 2026-08-31

## Objective

Make the standard GitHub Actions CI job self-contained by starting PostgreSQL, migrating its schema, and supplying the database URLs required by the OAuth integration tests.

## Discovery / Shared Understanding

- **Mode**: Small CI hotfix; full requirements interview skipped.
- **Failure evidence**: The latest `main` CI run reached the OAuth PostgreSQL integration specifications without an available PostgreSQL server, so database queries failed.
- **Assumption**: A single job-scoped database is sufficient because the workflow runs one verification job and the integration tests clean their own records.
- **Risk**: Migration and test consumers use different environment-variable names. Both must be configured explicitly even though they target the same isolated database.

## Acceptance Criteria

- [x] The CI verification job starts a healthy PostgreSQL 16 service.
- [x] CI explicitly defines both `DATABASE_URL` and `TEST_DATABASE_URL`.
- [x] Canonical migrations run before repository tests.
- [x] Repository check, tests, and build pass against an isolated PostgreSQL database.
- [ ] The pull-request CI run passes on GitHub Actions.

## Scope

### In scope

- GitHub Actions PostgreSQL service configuration.
- Migration execution before tests.
- Documentation of the CI database flow and the two database URL responsibilities.

### Out of scope

- Production or developer database provisioning.
- Application schema or OAuth behavior changes.
- Combining `DATABASE_URL` and `TEST_DATABASE_URL` into one configuration key.

## Required Tests

- [x] Workflow formatting and diff validation.
- [x] `bun run check`.
- [x] `bun run test` against an isolated PostgreSQL database.
- [x] `bun run build`.
- [ ] GitHub Actions pull-request verification.

## Tasks

- [x] Record the failing CI behavior.
- [x] Add the PostgreSQL CI service and explicit environment variables.
- [x] Run migrations before tests.
- [x] Document the integration-test database architecture.
- [x] Complete local verification.
- [x] Push and open a pull request to `main`.
- [ ] Obtain the required Code Owner approval and merge.

## Decisions and Work Log

- 2026-08-31: Chose a job-scoped PostgreSQL service instead of an external database.
- 2026-08-31: Kept separate migration and test environment variables while pointing both at the same isolated CI database.
- 2026-08-31: Kept schema ownership in `apps/migrator` and added `bun run db:migrate` before tests.

## Handoff

- **Commit/PR**: `b6a55fa`; [PR #14](https://github.com/doremi31618/monorepo-system-template/pull/14)
- **Validation**: Prettier, migration, `bun run check`, `bun run test`, and `bun run build` passed against an isolated PostgreSQL 16 database. The existing Web check reports 16 warnings and 0 errors.
- **Known issues**: GitHub Actions verification and the required Code Owner approval are pending.
- **Next action**: Verify the pull-request CI run, then obtain approval and merge.
