import Link from 'next/link';

import { NewSessionForm } from '@/components/workspace/new-session-form';
import { requireAuthenticatedPageUser } from '@/lib/auth/middleware';
import { getTemplateCatalog } from '@/lib/templates';

export default async function WorkspaceNewPage() {
  await requireAuthenticatedPageUser();

  const templates = getTemplateCatalog().map((template) => ({
    checklist: template.checklist,
    description: template.description,
    estimatedMinutes: template.estimatedMinutes,
    methodologyMap: template.methodologyMap,
    name: template.name,
    sections: template.sections,
    type: template.type,
  }));

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="section-label">Workspace</span>
            <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)]">새 작업 시작</h1>
          </div>
          <Link
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]"
            href="/workspace"
          >
            대시보드로
          </Link>
        </div>

        <NewSessionForm templates={templates} />
      </div>
    </main>
  );
}
