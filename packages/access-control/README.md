# @platform/access-control

**Framework：NestJS 10；大模組：Auth；子模組：Access Control**

提供角色／權限管理、`AccessControlService`、`RBACGuard`、`@RequirePermissions` 與 schema。權限代碼由 shared contracts/config 統一管理。

```ts
import {
  AccessControlModule,
  AccessControlService,
  RequirePermissions,
} from '@platform/access-control';
```

這是既有 package 名稱；新的 framework-bound 關聯模組應遵守 `nest-<大模組>-<子模組>` 命名規則。
