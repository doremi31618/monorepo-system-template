# `@platform/browser-sdk`

瀏覽器專用、但不綁 UI framework 的 HTTP client、Session storage 與搜尋工具。不要在 NestJS 或其他 Node.js server package 使用。

- Runtime：Browser
- Framework：無
- 相依：`@platform/types-shared`

```ts
import { SDK } from '@platform/browser-sdk';

const client = new SDK.Frontend.HttpClient('http://localhost:3333');
const response = await client.get<{ id: string }>('/resource/1');
```

應用程式負責提供 API base URL；此套件會處理 credentials、Bearer token 與 refresh retry。
