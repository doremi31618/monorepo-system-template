# `@platform/nest-infra-mail`

NestJS 郵件模組，提供郵件寄送、設定與 outbox schema。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：Database

```ts
import { Module } from '@nestjs/common';
import { MailModule } from '@platform/nest-infra-mail';

@Module({ imports: [MailModule] })
export class InfraCompositionModule {}
```

應用環境需提供郵件供應商設定；呼叫端透過注入的 `MailService` 寄送信件。
