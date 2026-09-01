# @platform/cms

**Framework：無（純 TypeScript）**

CMS 的框架中立核心，提供公開／私有文章搜尋的 query、summary、page contracts，以及純文字／HTML render utilities。這裡不能放 NestJS controller、DTO decorator、class-validator、Drizzle schema 或資料庫 service。

```ts
import type { CmsPublicSearchQuery, CmsSearchPage } from '@platform/cms';
import { renderBlocksToHtml } from '@platform/cms';
```

NestJS 與 Drizzle 實作位於 `@platform/nest-cms`。執行 `bun run --filter @platform/cms build` 與 `bun run --filter @platform/cms test:unit` 驗證本 package。
