import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="section-label">Session</span>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{session.template.name}</h1>
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

        <SessionCanvas initialSession={session} />
      </div>
    </main>
  );
}
