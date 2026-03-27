import { NextResponse } from 'next/server';

import { comparePassword } from '@/lib/auth/password';
import { findLoginUserRecord, findUserById } from '@/lib/auth/service';
import { setAuthCookie } from '@/lib/auth/session';
import { loginRequestSchema } from '@/lib/auth/validators';

async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const parsedRequest = loginRequestSchema.safeParse(requestBody);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          message: '로그인 입력값이 올바르지 않습니다.',
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    const loginUser = await findLoginUserRecord(parsedRequest.data.loginId);

    if (!loginUser) {
      return NextResponse.json(
        {
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
          status: 401,
        },
        {
          status: 401,
        },
      );
    }

    if (!(await comparePassword(parsedRequest.data.password, loginUser.passwordHash))) {
      return NextResponse.json(
        {
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
          status: 401,
        },
        {
          status: 401,
        },
      );
    }

    const authenticatedUser = await findUserById(loginUser.id);

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          message: '사용자 작업공간을 찾을 수 없습니다.',
          status: 404,
        },
        {
          status: 404,
        },
      );
    }

    const response = NextResponse.json(
      {
        data: {
          user: authenticatedUser,
        },
        message: '로그인에 성공했습니다.',
        status: 200,
      },
      {
        status: 200,
      },
    );

    setAuthCookie(response, {
      role: authenticatedUser.role,
      userId: authenticatedUser.userId,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown login error';

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

export { POST };
