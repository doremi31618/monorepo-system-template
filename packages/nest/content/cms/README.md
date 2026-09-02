# `@platform/nest-content-cms`

NestJS 的 Content／CMS 子模組，提供文章、標籤、公開內容、link preview 與 dashboard analytics。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：Assets、Users

```ts
import { Module } from '@nestjs/common';
import { CmsModule } from '@platform/nest-content-cms';

@Module({ imports: [CmsModule] })
export class ContentCompositionModule {}
```

跨前後端 CMS 資料形狀使用 `@platform/types-content`；controller 驗證 DTO 與 NestJS decorator 留在本套件。
