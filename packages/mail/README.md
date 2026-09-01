# @platform/mail

**Framework：NestJS 10；Transport：SMTP**

提供 `MailModule`、`MailService`、SMTP config 與 durable mail schema。由其他 Nest capabilities 注入使用。

```ts
import { MailModule, MailService } from '@platform/mail';
import * as mailSchema from '@platform/mail/schema';
```
