# `@platform/nest-identity-auth`

NestJS 的 Identity／Auth 模組，提供登入、Session、refresh token、Google 登入、登出與密碼重設。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：Users、Mail、Scheduling、Database、Logger

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@platform/nest-identity-auth';

@Module({ imports: [AuthModule] })
export class IdentityCompositionModule {}
```

請先在應用層用 `ConfigModule.forRoot({ validate })` 載入環境設定。Auth request DTO 與 `class-validator` 均由本套件擁有；純型別才放 `@platform/types-identity`。
