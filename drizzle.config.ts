import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://harp:harp@localhost:5432/harp';

export default defineConfig({
  dbCredentials: {
    url: DATABASE_URL,
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  strict: true,
  verbose: true,
});
