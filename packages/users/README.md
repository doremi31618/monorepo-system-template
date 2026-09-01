# @platform/users

**Framework：NestJS 10；大模組：Identity**

擁有 user module、service、repository、service interface 與 user schema。Auth、access control、assets 等 Nest capabilities 透過公開 API 使用它。

```ts
import { UserModule, UserService, IUserService } from '@platform/users';
import * as userSchema from '@platform/users/schema';
```
