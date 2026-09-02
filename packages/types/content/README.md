# `@platform/types-content`

Content 大模組跨前後端共用的純 TypeScript 型別，包含 assets 與 CMS 的 API 資料形狀。

- Runtime：Universal
- Framework：無
- 不可加入：NestJS DTO、UI 狀態、decorator 或驗證框架

```ts
import type { Asset, CmsPost, ListPublicPostsResponse } from '@platform/types-content';
```

新增欄位時應同步確認後端序列化結果與前端使用方式；未來 OpenAPI 工作流完成後，產生型別會取代手動維護的 API 形狀。
