import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { getDb } from '@/lib/db';
import { usersTable, workspacesTable } from '@/lib/db/schema';

let bootstrapPromise: Promise<void> | null = null;

async function ensureAdminAccount(): Promise<void> {
  const adminLoginId = process.env.ADMIN_LOGIN_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminLoginId || !adminPassword) {
    return;
  }

  const database = getDb();
  const existingAdminAccounts = await database
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, 'admin'))
    .limit(1);

  if (existingAdminAccounts.length > 0) {
    return;
  }

  const passwordHash = await hash(adminPassword, 12);
  const createdAdmins = await database
    .insert(usersTable)
    .values({
      employeeNumber: `admin-${adminLoginId}`,
      knoxId: `admin-${adminLoginId}`,
      loginId: adminLoginId,
      name: 'Administrator',
      passwordHash,
      role: 'admin',
    })
    .returning({ id: usersTable.id });

  const createdAdmin = createdAdmins[0];

  if (!createdAdmin) {
    throw new Error('Failed to create administrator account.');
  }

  await database.insert(workspacesTable).values({
    name: 'Administrator Workspace',
    ownerId: createdAdmin.id,
  });
}

async function runApplicationBootstrap(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const database = getDb();

      await migrate(database, { migrationsFolder: './drizzle' });
      await ensureAdminAccount();
    })();
  }

  await bootstrapPromise;
}

export { runApplicationBootstrap };
