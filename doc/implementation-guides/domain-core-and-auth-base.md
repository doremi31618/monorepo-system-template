# Domain Core & Auth Base Implementation Guide

本指南協助開發者實作 `Domain Core` (BaseRepository, IUserService) 與 `Auth Base` (UserIdentity, @CurrentUser) 重構，以達成架構解耦與標準化。

## 1. Domain Core Implementation

### 1-1. BaseRepository (Infra Layer)
在 `backend/src/core/infra/db/base.repository.ts` 建立抽象類別，封裝 Drizzle 的基本操作與型別。

```typescript
import { Inject } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export abstract class BaseRepository {
  constructor(
    @Inject('DB') protected readonly db: DrizzleDB,
  ) {}

  // 未來可加入 transaction helper 或通用 CRUD
  // protected get schema() { return schema; }
}
```

### 1-2. UserRepository Refactor
將 `UserRepository` 改為繼承 `BaseRepository`，並確保其僅依賴 Domain Schema (如果已拆分)。

```typescript
// backend/src/core/domain/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../infra/db/base.repository.js';
import { schema } from '../../infra/db/schema.js'; // 使用 aggregator 或 module specific schema

@Injectable()
export class UserRepository extends BaseRepository {
  // ... existing methods using this.db
}
```

### 1-3. IUserService Interface (Domain Layer)
為了讓 `AuthModule` 與具體的 `UserModule` 解耦 (Dependency Inversion)，需定義介面。

#### 為什麼需要這個介面? (Why & When)
- **解耦 (Decoupling)**: `AuthModule` 若直接 import `UserRepository`，會導致 `Auth` 依賴 DB 實作細節。
- **避免循環依賴 (Circular Dependency)**: 通常 `UserModule` 會依賴 `Auth` (例如建立使用者時雜湊密碼)，若 `Auth` 又依賴 `User` (驗證帳號)，容易造成 NestJS 循環相依問題。透過 Interface (`IUserService`)，我們可以讓 `Auth` 只相依於一個抽象介面，而 `User` 實作該介面。
- **測試性 (Testability)**: 測試 `AuthService` 時，可以輕鬆 mock `IUserService` 而不需要 mock 整個 Database Repo。

**Location**: `backend/src/core/domain/user/user.interface.ts`

```typescript
export interface IUserService {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserDto): Promise<UserEntity>;
  // ... 其他 Auth 需要的方法
}

export const IUserService = Symbol('IUserService'); // DI Token
```

### 1-4. AuthModule Refactor
調整 `AuthService` 不再直接依賴 `UserRepository`，改為依賴 `IUserService`。

**backend/src/core/domain/auth/auth.service.ts**:
```typescript
constructor(
  @Inject(IUserService) private readonly userService: IUserService,
  // ...
) {}
```

**backend/src/core/domain/auth/auth.module.ts**:
需匯入 `UserModule`，且 `UserModule` 需提供 `IUserService`。

**backend/src/core/domain/user/user.module.ts**:
```typescript
@Module({
  providers: [
    UserService,
    UserRepository,
    {
      provide: IUserService,
      useClass: UserService, // 或 UserRepository，視設計而定 (通常 Service 依賴 Repository，Auth 依賴 UserService)
    }
  ],
  exports: [IUserService]
})
export class UserModule {}
```

---

## 2. Auth Base Refinement

### 2-1. UserIdentity
確認後端使用的 `UserIdentity` 與 `@share/contract` 對齊。此物件代表 "已驗證的使用者上下文"。

```typescript
// 來自 @share/contract
export class UserIdentity {
  id: number;
  email: string;
  name: string;
  // ...
}
```

### 2-2. AuthGuard Enhancement
目前的 `AuthGuard` 僅回傳 `boolean`，需修改為將使用者資訊掛載到 `request` 物件上，以便後續 Controller 使用。

**backend/src/core/domain/auth/auth.guard.ts**:
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const token = extractToken(request);
  // ... verify token ...
  
  const session = await this.authService.inspectSession(token);
  // 關鍵：將 UserIdentity 掛載到 request
  request['user'] = {
    id: session.userId,
    // email/name 需視 SessionDto 是否包含，或需額外查詢
  };
  
  return true;
}
```
*註：若 Session 只有 ID，可能需要 Guard 額外呼叫 `userService.findById` 或者是讓 `inspectSession` 回傳更多資訊 (Cache 考量)。目前架構建議保持 Guard 輕量，若需詳細 User 可在 Controller 透過 Decorator 或 Service 再查。*

### 2-3. @CurrentUser Decorator
建立參數裝飾器以取得 `request.user`。

**Location**: `backend/src/core/infra/auth/decorator/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 驗收重點
1. `AuthService` 不再 import `UserRepository` (Concrete class)。
2. `AuthGuard` 通過後，Controller 可用 `@CurrentUser() user: UserIdentity` 取得當前使用者。
3. `BaseRepository` 被正確繼承。
