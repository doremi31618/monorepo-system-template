import { createDatabase, createPool } from '@platform/nest-infra-database';
import * as schema from './schema.js';

export { schema };

export function createDB(pool: Pool){
	return createDatabase(pool, schema);
}

export type DB = ReturnType<typeof createDB>;

export { createPool };
import type { Pool } from 'pg';
