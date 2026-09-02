# `@platform/nest-infra-database`

NestJS/Node.js 的 Drizzle 與 PostgreSQL 基礎能力，提供 pool、database factory 與 `BaseRepository`。

- Runtime：Node.js
- Framework：NestJS + Drizzle

```ts
import { createDatabase, createPool } from '@platform/nest-infra-database';

const pool = createPool(process.env.DATABASE_URL!);
const db = createDatabase(pool, schema);
```

本套件不知道任何業務 schema；各 Identity/Content 模組擁有自己的 schema，應用組合層負責聚合。
