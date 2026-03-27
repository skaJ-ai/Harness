import jwt from 'jsonwebtoken';

import { AUTH_COOKIE_MAX_AGE_SECONDS } from './constants';

import type { AuthTokenPayload } from './types';
import type { JwtPayload } from 'jsonwebtoken';

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwtSecret;
}

function isAuthTokenPayload(value: JwtPayload | string): value is JwtPayload & AuthTokenPayload {
  if (typeof value === 'string') {
    return false;
  }

  return typeof value.userId === 'string' && (value.role === 'admin' || value.role === 'user');
}

function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (!isAuthTokenPayload(decoded)) {
      return null;
    }

    return {
      role: decoded.role,
      userId: decoded.userId,
    };
  } catch {
    return null;
  }
}

export { signAuthToken, verifyAuthToken };
