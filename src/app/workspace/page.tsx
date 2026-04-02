import Link from 'next/link';

import { WorkspacePageHeader } from '@/components/workspace/page-header';
import { SessionList } from '@/components/workspace/session-list';
import { requireAuthenticatedPageUser } from '@/lib/auth/middleware';
import { listDeliverablesByWorkspace } from '@/lib/deliverables/service';
import { searchWorkspaceContent } from '@/lib/search/service';
import type { WorkspaceSearchResult } from '@/lib/search/types';
import { listSessionsByWorkspace } from '@/lib/sessions/service';
import { getTemplateByType } from '@/lib/templates';

function getSearchKindBadgeLabel(result: WorkspaceSearchResult): string {
  return result.kind === 'deliverable' ? '산출물' : '근거자료';
}

function getSearchMetaLabel(result: WorkspaceSearchResult): string {
  if (result.kind === 'deliverable') {
    return `${result.templateType ? getTemplateByType(result.templateType).name : 'template'} · ${result.status ?? 'draft'}`;
  }

  return `session source · ${result.sourceType ?? 'text'}`;
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const currentUser = await requireAuthenticatedPageUser();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? '';
  const [sessions, deliverables, searchResults] = await Promise.all([
    listSessionsByWorkspace(currentUser.workspaceId),
    listDeliverablesByWorkspace(currentUser.workspaceId),
    query.length > 0
      ? searchWorkspaceContent({
          query,
          workspaceId: currentUser.workspaceId,
        })
      : Promise.resolve([]),
  ]);
  const recentSessions = sessions.slice(0, 6);
  const recentDeliverables = deliverables.slice(0, 6);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <WorkspacePageHeader
          actions={
            <>
              <Link className="btn-secondary focus-ring" href="/">
                홈으로
              </Link>
              <Link className="btn-teal focus-ring" href="/workspace/new">
                새 작업 시작
              </Link>
            </>
          }
          description="private-first 환경에서 세션, 근거자료, 산출물을 누적하고, 같은 유형의 이전 작업을 다시 참조할 수 있습니다."
          eyebrow="Private Workspace"
          meta={
            <>
              <span className="badge badge-accent">{currentUser.workspaceName}</span>
              <span className="badge badge-neutral">{currentUser.loginId}</span>
              <span className="badge badge-neutral">사번 {currentUser.employeeNumber}</span>
              <span className="badge badge-neutral">Knox {currentUser.knoxId}</span>
            </>
          }
          title={`${currentUser.name}님의 HARP 작업공간`}
        />

        <section className="mb-6 grid gap-6 md:grid-cols-4">
          <div className="workspace-card flex flex-col gap-3">
            <span className="meta w-fit rounded border-[var(--color-border-strong)] bg-[var(--color-bg-sunken)] px-2 py-1">
              Workspace
            </span>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">
                {currentUser.workspaceName}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">private-first</p>
            </div>
          </div>
          <div className="workspace-card flex flex-col gap-3">
            <span className="meta w-fit rounded border-[var(--color-border-strong)] bg-[var(--color-bg-sunken)] px-2 py-1">
              Sessions
            </span>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{sessions.length}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">진행 중인 대화</p>
            </div>
          </div>
          <div className="workspace-card flex flex-col gap-3">
            <span className="meta w-fit rounded border-[var(--color-border-strong)] bg-[var(--color-bg-sunken)] px-2 py-1">
              Deliverables
            </span>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{deliverables.length}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">누적된 산출물</p>
            </div>
          </div>
          <div className="workspace-card-muted flex flex-col justify-center gap-3">
            <form action="/workspace" className="flex flex-col gap-3">
              <input
                className="input-surface w-full"
                defaultValue={query}
                name="q"
                placeholder="세션, 제목, 키워드 검색"
                type="search"
              />
              <button className="btn-secondary w-full" type="submit">
                전체 검색
              </button>
            </form>
          </div>
        </section>

        {query.length > 0 ? (
          <section className="mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <p className="meta">Workspace Search</p>
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                &quot;{query}&quot; 검색 결과
              </h2>
              <span className="badge badge-accent">{searchResults.length}건</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="workspace-card-muted p-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  일치하는 산출물이나 근거자료가 없습니다. 다른 키워드로 다시 검색해 주세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((result) => (
                  <Link
                    className="workspace-card group flex flex-col gap-3 transition hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-lg"
                    href={result.href}
                    key={`${result.kind}-${result.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-accent">
                          {getSearchKindBadgeLabel(result)}
                        </span>
                        <h3 className="font-headline text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)]">
                          {result.title}
                        </h3>
                      </div>
                      <span className="meta">{getSearchMetaLabel(result)}</span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {result.snippet}
                    </p>
                    <p className="mt-auto text-xs text-[var(--color-text-tertiary)]">
                      업데이트: {result.updatedAt.slice(0, 16).replace('T', ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  <span className="font-bold">✦</span>
                </span>
                <h2 className="font-headline text-xl font-bold text-[var(--color-text)]">
                  최근 작업
                </h2>
              </div>
              <span className="badge badge-neutral">{recentSessions.length}</span>
            </div>

            <SessionList sessions={recentSessions} />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-teal-light)] text-[var(--color-teal)]">
                  <span className="font-bold">✦</span>
                </span>
                <h2 className="font-headline text-xl font-bold text-[var(--color-text)]">
                  최근 산출물
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
                  href="/workspace/deliverables"
                >
                  전체 보기 →
                </Link>
                <span className="badge badge-teal">{recentDeliverables.length}</span>
              </div>
            </div>

            {recentDeliverables.length === 0 ? (
              <div className="workspace-card-muted p-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  아직 생성된 산출물이 없습니다. 세션에서 정리하기를 눌러 첫 draft를 만들어 보세요.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentDeliverables.map((deliverable) => (
                  <Link
                    className="workspace-card group transition hover:border-[var(--color-teal)]"
                    href={`/workspace/asset/${deliverable.id}`}
                    key={deliverable.id}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="meta">
                        {getTemplateByType(deliverable.templateType).name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">{deliverable.status}</span>
                        <span className="badge badge-teal font-bold">v{deliverable.version}</span>
                      </div>
                    </div>
                    <h3 className="font-headline mb-2 text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-teal)]">
                      {deliverable.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {deliverable.preview}
                    </p>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {deliverable.updatedAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
