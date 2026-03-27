import { NextResponse } from 'next/server';

import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import {
  getDeliverableDetailForWorkspace,
  updateDeliverableForWorkspace,
} from '@/lib/deliverables/service';
import { updateDeliverableRequestSchema } from '@/lib/deliverables/validators';

async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const { id } = await params;
    const deliverable = await getDeliverableDetailForWorkspace(id, currentUser.workspaceId);

    if (!deliverable) {
      return NextResponse.json(
        {
          message: '산출물을 찾을 수 없습니다.',
          status: 404,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      data: {
        deliverable,
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown deliverable detail error';
    const status = message === 'Authentication required.' ? 401 : 500;

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

async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const requestBody = await request.json();
    const parsedRequest = updateDeliverableRequestSchema.safeParse(requestBody);
    const { id } = await params;

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          message: parsedRequest.error.issues[0]?.message ?? '산출물 수정값이 올바르지 않습니다.',
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    const deliverable = await updateDeliverableForWorkspace({
      deliverableId: id,
      markdown: parsedRequest.data.markdown,
      status: parsedRequest.data.status,
      title: parsedRequest.data.title,
      workspaceId: currentUser.workspaceId,
    });

    return NextResponse.json({
      data: {
        deliverable,
      },
      message: '산출물이 업데이트되었습니다.',
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown deliverable patch error';
    const status =
      message === 'Authentication required.'
        ? 401
        : message === '산출물을 찾을 수 없습니다.'
          ? 404
          : message === '허용되지 않은 산출물 상태 전이입니다.' ||
              message === '산출물 Markdown 형식이 올바르지 않습니다.'
            ? 400
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

export { GET, PATCH };
