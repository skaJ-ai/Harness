import { eq, or } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { usersTable, workspacesTable } from '@/lib/db/schema';

import { hashPassword } from './password';

import type { AuthenticatedUser, SignupRequestBody } from './types';

interface ExistingSignupConflict {
  field: 'employeeNumber' | 'knoxId' | 'loginId';
  message: string;
}

interface LoginUserRecord {
  id: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

async function createUserWithWorkspace(
  signupRequestBody: SignupRequestBody,
): Promise<AuthenticatedUser> {
  const database = getDb();
  const passwordHash = await hashPassword(signupRequestBody.password);

  return database.transaction(async (transaction) => {
    const createdUsers = await transaction
      .insert(usersTable)
      .values({
        employeeNumber: signupRequestBody.employeeNumber,
        knoxId: signupRequestBody.knoxId,
        loginId: signupRequestBody.loginId,
        name: signupRequestBody.name,
        passwordHash,
        role: 'user',
      })
      .returning({
        employeeNumber: usersTable.employeeNumber,
        id: usersTable.id,
        knoxId: usersTable.knoxId,
        loginId: usersTable.loginId,
        name: usersTable.name,
        role: usersTable.role,
      });

    const createdUser = createdUsers[0];

    if (!createdUser) {
      throw new Error('Failed to create user.');
    }

    const createdWorkspaces = await transaction
      .insert(workspacesTable)
      .values({
        name: `${createdUser.name} Workspace`,
        ownerId: createdUser.id,
      })
      .returning({
        id: workspacesTable.id,
        name: workspacesTable.name,
      });

    const createdWorkspace = createdWorkspaces[0];

    if (!createdWorkspace) {
      throw new Error('Failed to create workspace.');
    }

    return {
      employeeNumber: createdUser.employeeNumber,
      knoxId: createdUser.knoxId,
      loginId: createdUser.loginId,
      name: createdUser.name,
      role: createdUser.role,
      userId: createdUser.id,
      workspaceId: createdWorkspace.id,
      workspaceName: createdWorkspace.name,
    };
  });
}

async function findExistingSignupConflict(
  signupRequestBody: SignupRequestBody,
): Promise<ExistingSignupConflict | null> {
  const database = getDb();
  const existingUsers = await database
    .select({
      employeeNumber: usersTable.employeeNumber,
      knoxId: usersTable.knoxId,
      loginId: usersTable.loginId,
    })
    .from(usersTable)
    .where(
      or(
        eq(usersTable.employeeNumber, signupRequestBody.employeeNumber),
        eq(usersTable.knoxId, signupRequestBody.knoxId),
        eq(usersTable.loginId, signupRequestBody.loginId),
      ),
    )
    .limit(1);

  const existingUser = existingUsers[0];

  if (!existingUser) {
    return null;
  }

  if (existingUser.loginId === signupRequestBody.loginId) {
    return {
      field: 'loginId',
      message: '이미 사용 중인 아이디입니다.',
    };
  }

  if (existingUser.employeeNumber === signupRequestBody.employeeNumber) {
    return {
      field: 'employeeNumber',
      message: '이미 등록된 사번입니다.',
    };
  }

  return {
    field: 'knoxId',
    message: '이미 등록된 Knox ID입니다.',
  };
}

async function findLoginUserRecord(loginId: string): Promise<LoginUserRecord | null> {
  const database = getDb();
  const loginUsers = await database
    .select({
      id: usersTable.id,
      passwordHash: usersTable.passwordHash,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.loginId, loginId))
    .limit(1);

  return loginUsers[0] ?? null;
}

async function findUserById(userId: string): Promise<AuthenticatedUser | null> {
  const database = getDb();
  const authenticatedUsers = await database
    .select({
      employeeNumber: usersTable.employeeNumber,
      knoxId: usersTable.knoxId,
      loginId: usersTable.loginId,
      name: usersTable.name,
      role: usersTable.role,
      userId: usersTable.id,
      workspaceId: workspacesTable.id,
      workspaceName: workspacesTable.name,
    })
    .from(usersTable)
    .innerJoin(workspacesTable, eq(workspacesTable.ownerId, usersTable.id))
    .where(eq(usersTable.id, userId))
    .limit(1);

  return authenticatedUsers[0] ?? null;
}

export { createUserWithWorkspace, findExistingSignupConflict, findLoginUserRecord, findUserById };
