# Technical Specification: Core Refactor (R1)

> **Owner**: System Designer
> **Feature**: Core Architecture
> **Implementation Guides**:
> - [01. Logger & Error Handling](./R1-01-logger-and-error-handling.md)
> - [02. Domain Core & Auth Base](./R1-02-domain-core-and-auth-base.md)
> - [03. CI/CD & Scheduling](./R1-03-cicd-and-scheduling.md)

## 1. Architecture
- **Layered Arch**: Feature -> Domain -> Infra.
- **Module Boundaries**: Enforced by ESLint rules.

## 2. Shared Libraries
- `@packages/contracts`: DTOs & Constants.
- `@packages/sdk`: Frontend Logic (HttpClient).

## 3. Infrastructure
- **DB**: Drizzle ORM + Postgres.
- **Config**: Typed ConfigModule (Zod).
- **Logger**: JSON/Pretty Logger.
