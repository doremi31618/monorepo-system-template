# @platform/database

**Framework：NestJS-compatible infrastructure；Persistence：Drizzle/PostgreSQL**

提供 PostgreSQL pool、Drizzle database factory 與 `BaseRepository`。它不擁有任何業務資料表；schema 由各 capability package 擁有，再由 app/migrator 組裝。

```ts
import { createDatabase, createPool, BaseRepository } from '@platform/database';
```
