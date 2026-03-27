import { NextResponse } from 'next/server';

import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import { createSourceForSession } from '@/lib/sessions/service';
import { createSourceRequestSchema } from '@/lib/sessions/validators';

async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const requestBody = await request.json();
    const parsedRequest = createSourceRequestSchema.safeParse(requestBody);
    const { id } = await params;

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          message: '근거자료 입력값이 올바르지 않습니다.',
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    await createSourceForSession({
      content: parsedRequest.data.content,
      label: parsedRequest.data.label,
      sessionId: id,
      type: parsedRequest.data.type,
      workspaceId: currentUser.workspaceId,
    });

    return NextResponse.json(
      {
        message: '근거자료가 저장되었습니다.',
        status: 201,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown source creation error';
    const status =
      message === 'Authentication required.'
        ? 401
        : message === '세션을 찾을 수 없습니다.'
          ? 404
          : 500;

    return NextResponse.json(
      {
        message,
        status,
      },
      {
        status,
      },
    );
  }
}

export { POST };
