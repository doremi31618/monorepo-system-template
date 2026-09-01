# @platform/config

**Framework：NestJS Config + Zod**

集中管理環境變數驗證、app config 與 access-control seed config。消費端應使用公開 exports，不要複製 env parsing。

```ts
import { appConfig, envSchema, validate } from '@platform/config';
```
