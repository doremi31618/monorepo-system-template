# @platform/scheduling

**Framework：NestJS 10；Persistence：Drizzle/PostgreSQL**

提供排程 module、service、repository、job schema 與 `JobSchedulerPort`。需要背景工作但還不需要獨立 worker app 時，由 Nest API 組裝此 capability。

```ts
import { SchedulingModule, SchedulingService } from '@platform/scheduling';
import * as schedulingSchema from '@platform/scheduling/schema';
```
