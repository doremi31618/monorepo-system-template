# `@platform/nest-infra-scheduling`

NestJS 排程模組，提供分散式鎖定、工作執行狀態與稽核 schema。

- Runtime：Node.js
- Framework：NestJS Schedule
- 主要相依：Database、Logger

```ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulingModule } from '@platform/nest-infra-scheduling';

@Module({ imports: [ScheduleModule.forRoot(), SchedulingModule] })
export class InfraCompositionModule {}
```

功能模組應依賴 `JobSchedulerPort` 或注入 service，不要自行重複建立排程基礎設施。
本模組只讀取自己的 `WORKER_ID`；未提供時會產生 hostname-based worker ID，不依賴 API runtime config。
