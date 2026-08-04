# How to Write Automated Confidence Tests (E2E / Functional)

> **Philosophy**: Quality Assurance > Test Coverage  
> We do **not** aim for 100% coverage.  
> We aim for **100% confidence in critical paths**.

This document focuses on **automated functional confidence tests**:

- HTTP-level **E2E tests**
- Using **Jest + Supertest**
- Running against a **real NestJS app instance**

---

## 🎯 Strategy: “1 Meaningful Test per Module (Minimum)”

For every module, you must have **at least 1 meaningful E2E test**.

### What is a “Meaningful Test”?

A meaningful test targets logic that is:

1. **Critical**  
   If this breaks, the business stops  
   (e.g., Login, RBAC, Publishing).

2. **Fragile**  
   Logic that developers often break accidentally  
   (e.g., Permissions, Regex, edge cases).

3. **Hard to debug**  
   Multi-step flows  
   (auth → permission → data → response).

### Example: CMS Module

- ❌ **Useless**:  
  Check if `createPost()` returns the same DTO you sent.

- ✅ **Meaningful**:  
  Public users cannot access **draft** content.

- ✅ **Meaningful**:  
  Unauthorized users cannot **publish**.

---

## 🧱 Test Types (So We Don’t Abuse E2E)

- **Unit tests**  
  Pure logic (service, policy). Fast & cheap.

- **Integration tests**  
  Service + DB / infra. Medium cost.

- **E2E / Functional tests (this document)**  
  HTTP + guards + routing + serialization.  
  Slow, but **highest confidence**.

### Rule of thumb

- Use **Unit tests** for most logic.
- Use **E2E tests** **only for critical paths**.

---

## ✅ E2E Quality Rules (Non-Negotiable)

### 1) Tests must be **repeatable**
- A test should pass when run **twice**, locally or in CI.

### 2) Tests must be **isolated**
- Each test creates its **own data**.
- Never rely on existing DB state unless explicitly standardized.

### 3) Tests must be **environment-independent**

Prefer **self-contained setup**:

- Create users at test runtime  
  (`/auth/signup` or direct DB insert).
- Avoid hardcoded accounts  
  (e.g., `admin@sys.com / 123`)  
  unless CI **guarantees seed data**.

### 4) Tests must be **parallel-safe** (future-proof)

- Use unique data per test  
  (`Date.now()` / random suffix).
- Do **not** assume execution order between tests.

---

## 🛠️ Tooling

We use:

- **Jest** — test runner
- **Supertest** — send HTTP requests to the Nest app server

---

## 📁 File Location & Naming

Create E2E tests at: `apps/api/test/<module>.e2e-spec.ts`

```typescript
// Basic Template
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('My Module (e2e)', () => {
    let app;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('v1');
        await app.init();
    });

    afterAll(async () => await app.close());

    it('should perform meaningful action', async () => {
         // ...
    });
});
```