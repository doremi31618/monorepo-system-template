import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export function createPool(connectionString: string) {
  return new Pool({ connectionString });
}

export function createDatabase<TSchema extends Record<string, unknown>>(
  pool: Pool,
  schema: TSchema,
) {
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
