# @platform/nest-cms

**Framework：NestJS 10 + Drizzle**

CMS 的 Nest adapter，擁有 REST controllers、`CmsModule`、`CmsService` 與 CMS schema。`CmsService` 同時供 REST 與 app-level MCP tool composition 使用；MCP 邏輯不放在這個 package。

```ts
import { CmsModule, CmsService } from '@platform/nest-cms';
import * as cmsSchema from '@platform/nest-cms/schema';
```

在 app module 匯入 `CmsModule` 後即可注入 `CmsService`。框架中立搜尋 contracts 從 `@platform/cms` 匯入。
