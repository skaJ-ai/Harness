import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AssetViewer } from '@/components/workspace/asset-viewer';
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
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="section-label">Asset Viewer</span>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{deliverable.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]"
              href="/workspace"
            >
              대시보드
            </Link>
            <Link
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)]"
              href="/workspace/new"
            >
              새 작업
            </Link>
          </div>
        </div>

        <AssetViewer initialDeliverable={deliverable} />
      </div>
    </main>
  );
}
