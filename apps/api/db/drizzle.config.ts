import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'node:url';

const repositoryDirectory = fileURLToPath(new URL('../../..', import.meta.url));

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

export default defineConfig({
  schema: [`${repositoryDirectory}/packages/nest/*/*/src/**/*.schema.ts`],
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
  },
});
