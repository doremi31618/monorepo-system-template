# `@platform/test-utils`

跨 package 共用的框架中立測試工具。目前提供 logger mock factory；不可被 production code 依賴。

- Runtime：Universal
- Framework：無

```ts
import { createMockLogger } from '@platform/test-utils';

const logger = createMockLogger(() => mock());
```
