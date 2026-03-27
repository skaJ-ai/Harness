import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { AUTH_REDIRECT_PATH } from './constants';
import { getCurrentUser } from './session';

import type { AuthenticatedUser } from './types';

class AuthenticationError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function createAuthenticationErrorResponse(message = 'Authentication required.'): NextResponse {
  return NextResponse.json(
    {
      message,
      status: 401,
    },
    {
      status: 401,
    },
  );
}

async function redirectAuthenticatedUser(): Promise<void> {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(AUTH_REDIRECT_PATH);
  }
}

async function requireAuthenticatedApiUser(): Promise<AuthenticatedUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new AuthenticationError();
  }

  return currentUser;
}

async function requireAuthenticatedPageUser(): Promise<AuthenticatedUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return currentUser;
}

export {
  AuthenticationError,
  createAuthenticationErrorResponse,
  redirectAuthenticatedUser,
  requireAuthenticatedApiUser,
  requireAuthenticatedPageUser,
};
