import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../api/.env' });

export default defineConfig({
  schema: ['../../packages/*/src/**/*.schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
  },
});
