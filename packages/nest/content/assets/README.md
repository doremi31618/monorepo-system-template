# `@platform/nest-content-assets`

NestJS 的 Content／Assets 子模組，提供 S3 presigned upload、完成上傳、下載 URL 與資產管理 API。

- Runtime：Node.js
- Framework：NestJS
- 主要相依：Config、Users、S3 SDK

```ts
import { Module } from '@nestjs/common';
import { AssetsModule } from '@platform/nest-content-assets';

@Module({ imports: [AssetsModule] })
export class ContentCompositionModule {}
```

應用層需提供 S3 相關環境設定。跨前後端的 asset 資料形狀使用 `@platform/types-content`；上傳驗證 DTO 留在本模組。
