# `@platform/nest-infra-logger`

NestJS 結構化日誌模組，提供可注入的 `LoggerService`。

- Runtime：Node.js
- Framework：NestJS

```ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@platform/nest-infra-logger';

@Module({ imports: [LoggerModule] })
export class InfraCompositionModule {}
```

在 service constructor 注入 `LoggerService`，並以 `setContext()` 設定來源。
模組只註冊自己的 `logger.pretty` 設定；不依賴 API 的 host、port 或其他應用程式設定。
