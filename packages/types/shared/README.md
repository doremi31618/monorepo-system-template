# `@platform/types-shared`

框架中立、可同時在 Node.js 與瀏覽器使用的最小共用型別層。目前只包含 API envelope、分頁與搜尋型別。

- Runtime：Universal
- Framework：無
- 不可加入：NestJS DTO、decorator、`class-validator`、特定業務模組型別

```ts
import type { ApiResponse, PaginatedResponse, SearchParams } from '@platform/types-shared';
```

若型別只屬於 Identity 或 Content，請分別放到 `@platform/types-identity` 或 `@platform/types-content`；驗證 DTO 留在其 NestJS 模組。
