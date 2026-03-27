import { NextResponse } from 'next/server';

import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import { generateDeliverableForSession } from '@/lib/deliverables/service';

async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const { id } = await params;
    const deliverable = await generateDeliverableForSession({
      sessionId: id,
      workspaceId: currentUser.workspaceId,
    });

    return NextResponse.json({
      data: {
        deliverable,
      },
      message: '산출물 초안이 생성되었습니다.',
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown deliverable generate error';
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
