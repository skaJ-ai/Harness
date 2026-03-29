import Link from 'next/link';
import { notFound } from 'next/navigation';

import { WorkspacePageHeader } from '@/components/workspace/page-header';
import { SessionCanvas } from '@/components/workspace/session-canvas';
import { requireAuthenticatedPageUser } from '@/lib/auth/middleware';
import { getSessionDetailForWorkspace } from '@/lib/sessions/service';

export default async function WorkspaceSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireAuthenticatedPageUser();
  const { id } = await params;
  const session = await getSessionDetailForWorkspace(id, currentUser.workspaceId);

  if (!session) {
    notFound();
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <WorkspacePageHeader
          actions={
            <>
              <Link className="btn-secondary focus-ring" href="/workspace">
                대시보드
              </Link>
              <Link className="btn-teal focus-ring" href="/workspace/new">
                새 작업
              </Link>
            </>
          }
          description={`${session.template.name} 템플릿으로 진행 중인 인터뷰입니다. 대화와 근거자료를 쌓으면서 오른쪽 캔버스에서 초안을 다듬을 수 있습니다.`}
          eyebrow="Interview Session"
          meta={
            <>
              <span className="badge badge-accent">{session.template.name}</span>
              <span className="badge badge-neutral">{session.status}</span>
              <span className="badge badge-teal">메시지 {session.messageCount}개</span>
              <span className="badge badge-neutral">자료 {session.sourceCount}개</span>
            </>
          }
          title={session.title}
        />

        <SessionCanvas initialSession={session} />
      </div>
    </main>
  );
}
