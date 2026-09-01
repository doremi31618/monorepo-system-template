# @platform/assets

**Framework：NestJS 10；Storage：S3-compatible**

提供 asset controller/service/module、S3 storage strategy、presigned URL 與 asset schema。CMS 只透過公開 API 與 schema subpath 使用它。

```ts
import { AssetsModule, AssetsService } from '@platform/assets';
import * as assetsSchema from '@platform/assets/schema';
```
