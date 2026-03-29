import Link from 'next/link';

import { WorkspacePageHeader } from '@/components/workspace/page-header';
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

        <section className="surface flex flex-col gap-6 p-8 shadow-[var(--shadow-2)]">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="doc-card flex flex-col gap-2">
              <span className="meta">Workspace</span>
              <p className="text-base font-semibold text-[var(--color-text)]">
                {currentUser.workspaceName}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                기본값은 private이며 본인 작업만 볼 수 있습니다.
              </p>
            </div>
            <div className="doc-card flex flex-col gap-2">
              <span className="meta">Sessions</span>
              <p className="text-base font-semibold text-[var(--color-text)]">
                {sessions.length}개
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                진행 중인 대화와 완료된 인터뷰를 이어서 열 수 있습니다.
              </p>
            </div>
            <div className="doc-card flex flex-col gap-2">
              <span className="meta">Deliverables</span>
              <p className="text-base font-semibold text-[var(--color-text)]">
                {deliverables.length}개
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                draft, final, promoted asset이 계속 축적됩니다.
              </p>
            </div>
            <div className="doc-card flex flex-col gap-2">
              <span className="meta">Search</span>
              <p className="text-base font-semibold text-[var(--color-text)]">workspace FTS</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                제목, 초안, 근거자료 텍스트를 한 번에 검색합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form action="/workspace" className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                className="input-surface w-full flex-1"
                defaultValue={query}
                name="q"
                placeholder="세션 메모, 산출물 제목, 핵심 키워드를 검색하세요."
                type="search"
              />
              <button className="btn-primary focus-ring" type="submit">
                검색
              </button>
            </form>

            <p className="max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
              지금 필요한 초안과 과거 자산을 한 화면에서 찾고 이어서 작업할 수 있습니다.
            </p>
          </div>
        </section>

        {query.length > 0 ? (
          <section className="surface flex flex-col gap-5 p-8 shadow-[var(--shadow-2)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="meta">Workspace Search</p>
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">
                  &quot;{query}&quot; 검색 결과
                </h2>
              </div>
              <span className="badge badge-accent">{searchResults.length}건</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="doc-card p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  일치하는 산출물이나 근거자료가 없습니다. 다른 키워드로 다시 검색해 주세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((result) => (
                  <Link
                    className="surface-interactive flex flex-col gap-3 p-5"
                    href={result.href}
                    key={`${result.kind}-${result.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-accent">
                          {getSearchKindBadgeLabel(result)}
                        </span>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                          {result.title}
                        </h3>
                      </div>
                      <span className="badge badge-neutral">{getSearchMetaLabel(result)}</span>
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {result.snippet}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      업데이트: {result.updatedAt.slice(0, 16).replace('T', ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="surface flex flex-col gap-5 p-8 shadow-[var(--shadow-2)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="meta">Recent Sessions</p>
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">최근 작업</h2>
              </div>
              <span className="badge badge-accent">{recentSessions.length}개</span>
            </div>

            {recentSessions.length === 0 ? (
              <div className="doc-card p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  아직 시작한 작업이 없습니다. 새 작업을 만들어 산파술 인터뷰를 시작하세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentSessions.map((session) => (
                  <Link
                    className="surface-interactive flex flex-col gap-3 p-5"
                    href={`/workspace/session/${session.id}`}
                    key={session.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-accent">{session.template.name}</span>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                          {session.title}
                        </h3>
                      </div>
                      <span className="badge badge-neutral">{session.status}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      메시지 {session.messageCount}개 · 자료 {session.sourceCount}개
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      마지막 업데이트: {session.updatedAt.slice(0, 16).replace('T', ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="surface flex flex-col gap-5 p-8 shadow-[var(--shadow-2)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="meta">Recent Deliverables</p>
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">최근 산출물</h2>
              </div>
              <span className="badge badge-teal">{recentDeliverables.length}개</span>
            </div>

            {recentDeliverables.length === 0 ? (
              <div className="doc-card p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  아직 생성된 산출물이 없습니다. 세션에서 정리하기를 눌러 첫 draft를 만들어 보세요.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentDeliverables.map((deliverable) => (
                  <Link
                    className="surface-interactive flex flex-col gap-3 p-5"
                    href={`/workspace/asset/${deliverable.id}`}
                    key={deliverable.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-teal">
                          {getTemplateByType(deliverable.templateType).name}
                        </span>
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                          {deliverable.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">{deliverable.status}</span>
                        <span className="badge badge-accent">v{deliverable.version}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {deliverable.preview}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      마지막 업데이트: {deliverable.updatedAt.slice(0, 16).replace('T', ' ')}
                    </p>
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
