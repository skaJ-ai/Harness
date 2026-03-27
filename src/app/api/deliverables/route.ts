import { NextResponse } from 'next/server';

import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import { listDeliverablesByWorkspace } from '@/lib/deliverables/service';

async function GET() {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const deliverables = await listDeliverablesByWorkspace(currentUser.workspaceId);

    return NextResponse.json({
      data: {
        deliverables,
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown deliverable list error';
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
