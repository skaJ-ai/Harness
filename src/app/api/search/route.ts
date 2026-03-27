import { NextResponse } from 'next/server';

import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import { searchWorkspaceContent } from '@/lib/search/service';

async function GET(request: Request) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() ?? '';

    if (query.length === 0) {
      return NextResponse.json(
        {
          message: '검색어를 입력해 주세요.',
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    const results = await searchWorkspaceContent({
      query,
      workspaceId: currentUser.workspaceId,
    });

    return NextResponse.json({
      data: {
        results,
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown search error';
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

export { GET };
