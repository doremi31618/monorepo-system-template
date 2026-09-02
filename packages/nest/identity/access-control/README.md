# `@platform/nest-identity-access-control`

NestJS 的 Identity／Access Control 子模組，提供角色、權限、RBAC guard 與管理 API。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：Auth、Users、Database、Logger

```ts
import { Module } from '@nestjs/common';
import {
  AccessControlModule,
  RBACGuard,
  RequirePermissions,
} from '@platform/nest-identity-access-control';
import { PermissionCodes } from '@platform/types-identity';

@Module({
  imports: [
    AccessControlModule.registerAsync({
      inject: [ApplicationConfig],
      useFactory: (config: ApplicationConfig) => config.accessControl,
    }),
  ],
})
export class IdentityCompositionModule {}

// Controller method 上使用：
// @UseGuards(RBACGuard)
// @RequirePermissions(PermissionCodes.Users.Read)
```

管理 API 的驗證 DTO 留在本模組；permission code 的框架中立常數由 `@platform/types-identity` 提供。
角色、權限與 Root Admin 初始化值由應用程式透過 `registerAsync()` 注入，本 package 不讀取應用程式的完整環境設定。
