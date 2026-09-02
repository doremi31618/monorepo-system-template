# `@platform/nest-identity-users`

NestJS 的 Identity／Users 模組，擁有 user schema、repository、service 與模組註冊。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：`@platform/nest-infra-database`、`@platform/types-identity`

```ts
import { Module } from '@nestjs/common';
import { UserModule } from '@platform/nest-identity-users';

@Module({ imports: [UserModule] })
export class IdentityCompositionModule {}
```

輸入驗證 DTO 應放在本模組；跨 runtime 的純資料形狀放在 `@platform/types-identity`。
