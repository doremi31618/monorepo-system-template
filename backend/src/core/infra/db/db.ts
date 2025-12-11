import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.warn(
		'DATABASE_URL is not set; falling back to default pg connection params'
	);
}

export const pool = new Pool({
	connectionString
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export { schema };
