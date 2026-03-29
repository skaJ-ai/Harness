import Link from 'next/link';

import { NewSessionForm } from '@/components/workspace/new-session-form';
import { WorkspacePageHeader } from '@/components/workspace/page-header';
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
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <WorkspacePageHeader
          actions={
            <Link className="btn-secondary focus-ring" href="/workspace">
              대시보드로
            </Link>
          }
          description="산출물 유형을 고르면 HARP가 먼저 질문을 시작하고, 인터뷰 캔버스와 문서 초안이 함께 열립니다."
          eyebrow="New Session"
          meta={
            <>
              <span className="badge badge-accent">표준 템플릿 3종</span>
              <span className="badge badge-neutral">private workspace only</span>
            </>
          }
          title="새 작업 시작"
        />

        <NewSessionForm templates={templates} />
      </div>
    </main>
  );
}
