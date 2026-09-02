import type { INestApplication } from '@nestjs/common';
import type { Pool } from 'pg';

export async function closeTestApp(app: INestApplication): Promise<void> {
  const pool = app.get<Pool>('PG_POOL');
  await app.close();
  await pool.end();
}
