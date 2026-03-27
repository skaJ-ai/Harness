import { NextResponse } from 'next/server';

import { createUserWithWorkspace, findExistingSignupConflict } from '@/lib/auth/service';
import { setAuthCookie } from '@/lib/auth/session';
import { signupRequestSchema } from '@/lib/auth/validators';

async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const parsedRequest = signupRequestSchema.safeParse(requestBody);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          message: '회원가입 입력값이 올바르지 않습니다.',
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    const existingSignupConflict = await findExistingSignupConflict(parsedRequest.data);

    if (existingSignupConflict) {
      return NextResponse.json(
        {
          field: existingSignupConflict.field,
          message: existingSignupConflict.message,
          status: 409,
        },
        {
          status: 409,
        },
      );
    }

    const createdUser = await createUserWithWorkspace(parsedRequest.data);
    const response = NextResponse.json(
      {
        data: {
          user: createdUser,
        },
        message: '회원가입이 완료되었습니다.',
        status: 201,
      },
      {
        status: 201,
      },
    );

    setAuthCookie(response, {
      role: createdUser.role,
      userId: createdUser.userId,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown signup error';

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
