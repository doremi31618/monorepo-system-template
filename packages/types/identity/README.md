# `@platform/types-identity`

Identity 大模組跨前後端共用的純 TypeScript 型別，包含 auth、users、roles 與 permissions。

- Runtime：Universal
- Framework：無
- 不可加入：NestJS DTO、Swagger decorator、`class-validator`

```ts
import type { Session, UserWithRoles } from '@platform/types-identity';
import { PermissionCodes } from '@platform/types-identity';
```

NestJS 的輸入驗證 class 應留在 `nest-identity-*` 所屬模組，只以 `implements` 對齊這裡的純介面。
