import { NextResponse } from 'next/server';

import {
  AuthenticationError,
  createAuthenticationErrorResponse,
  requireAuthenticatedApiUser,
} from '@/lib/auth/middleware';

async function GET() {
  try {
    const currentUser = await requireAuthenticatedApiUser();

    return NextResponse.json(
      {
        data: {
          user: currentUser,
        },
        message: '현재 사용자 정보를 조회했습니다.',
        status: 200,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createAuthenticationErrorResponse(error.message);
    }

    const message = error instanceof Error ? error.message : 'Unknown auth error';

    return NextResponse.json(
      {
        message,
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
}

export { GET };
