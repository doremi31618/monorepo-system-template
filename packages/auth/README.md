# @platform/auth

**Framework：NestJS 10；大模組：Auth**

擁有 session authentication、password/Google login、guards、decorators、repository 與 auth schema。OAuth authorization server 是另一個 capability：`@platform/oauth-server`。

```ts
import {
  AuthModule,
  AuthGuard,
  AuthService,
  CurrentUser,
} from '@platform/auth';
import * as authSchema from '@platform/auth/schema';
```
