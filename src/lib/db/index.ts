import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

interface DatabaseHealth {
  isHealthy: boolean;
  message: string;
}

type DatabaseClient = NodePgDatabase<typeof schema>;

let databaseClient: DatabaseClient | null = null;
let databasePool: Pool | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return databaseUrl;
}

function getPool(): Pool {
  if (databasePool) {
    return databasePool;
  }

  databasePool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  return databasePool;
}

function getDb(): DatabaseClient {
  if (databaseClient) {
    return databaseClient;
  }

  databaseClient = drizzle(getPool(), { schema });

  return databaseClient;
}

async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  try {
    await getDb().execute(sql`select 1`);

    return {
      isHealthy: true,
      message: 'Database connection is healthy.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';

    return {
      isHealthy: false,
      message,
    };
  }
}

export { checkDatabaseConnection, getDb, getPool };
