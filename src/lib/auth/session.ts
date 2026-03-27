import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from './constants';
import { signAuthToken, verifyAuthToken } from './jwt';
import { findUserById } from './service';

import type { AuthenticatedUser, AuthTokenPayload } from './types';

async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!authToken) {
    return null;
  }

  const tokenPayload = verifyAuthToken(authToken);

  if (!tokenPayload) {
    return null;
  }

  return findUserById(tokenPayload.userId);
}

function setAuthCookie(response: NextResponse, tokenPayload: AuthTokenPayload): void {
  response.cookies.set(AUTH_COOKIE_NAME, signAuthToken(tokenPayload), AUTH_COOKIE_OPTIONS);
}

function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export { clearAuthCookie, getCurrentUser, setAuthCookie };
