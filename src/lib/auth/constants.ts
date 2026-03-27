const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_COOKIE_NAME = 'harp-token';
const AUTH_REDIRECT_PATH = '/workspace';

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  path: '/',
  sameSite: 'lax' as const,
  secure: false,
};

export { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS, AUTH_REDIRECT_PATH };
