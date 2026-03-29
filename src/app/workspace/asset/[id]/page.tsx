import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AssetViewer } from '@/components/workspace/asset-viewer';
import { WorkspacePageHeader } from '@/components/workspace/page-header';
import { requireAuthenticatedPageUser } from '@/lib/auth/middleware';
import { getDeliverableDetailForWorkspace } from '@/lib/deliverables/service';

export default async function WorkspaceAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await requireAuthenticatedPageUser();
  const { id } = await params;
  const deliverable = await getDeliverableDetailForWorkspace(id, currentUser.workspaceId);

  if (!deliverable) {
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
          description="정리된 draft와 근거 메타데이터를 확인하고, final 또는 promoted asset으로 상태를 승격할 수 있습니다."
          eyebrow="Deliverable Viewer"
          meta={
            <>
              <span className="badge badge-accent">{deliverable.templateName}</span>
              <span className="badge badge-neutral">{deliverable.status}</span>
              <span className="badge badge-teal">v{deliverable.version}</span>
            </>
          }
          title={deliverable.title}
        />

        <AssetViewer initialDeliverable={deliverable} />
      </div>
    </main>
  );
}
