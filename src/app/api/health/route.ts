import { NextResponse } from 'next/server';

import { checkDatabaseConnection } from '@/lib/db';

export const runtime = 'nodejs';

async function GET() {
  const databaseHealth = await checkDatabaseConnection();
  const statusCode = databaseHealth.isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      checks: {
        database: {
          message: databaseHealth.message,
          status: databaseHealth.isHealthy ? 'up' : 'down',
        },
        llm: {
          model: process.env.LLM_MODEL ?? null,
          status: process.env.LLM_API_URL && process.env.LLM_MODEL ? 'configured' : 'missing',
          url: process.env.LLM_API_URL ?? null,
        },
      },
      service: 'harp',
      status: databaseHealth.isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
    },
  );
}

export { GET };
