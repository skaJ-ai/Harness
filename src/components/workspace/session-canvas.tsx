'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import useSWR from 'swr';

import type { DeliverableDetail } from '@/lib/deliverables/types';
import type { SessionChatMessage, SessionDetail } from '@/lib/sessions/types';
import { safeFetch } from '@/lib/utils';

interface SessionCanvasProps {
  initialSession: SessionDetail;
}

interface SessionDetailResponse {
  data: {
    session: SessionDetail;
  };
}

interface SourceCreateResponse {
  message: string;
}

interface GenerateDeliverableResponse {
  data: {
    deliverable: DeliverableDetail;
  };
  message: string;
}

interface SessionDetailFetcherResult {
  session: SessionDetail;
}

function createUiMessages(messages: SessionChatMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    parts: [
      {
        text: message.content,
        type: 'text',
      },
    ],
    role: message.role,
  }));
}

async function fetchSessionDetail(url: string): Promise<SessionDetailFetcherResult> {
  const result = await safeFetch<SessionDetailResponse>(url, {
    cache: 'no-store',
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    session: result.data.data.session,
  };
}

function getVisibleMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: 'text' }> =>
        part.type === 'text',
    )
    .map((part) => part.text)
    .join('')
    .trim();
}

function SessionCanvas({ initialSession }: SessionCanvasProps) {
  const [chatInput, setChatInput] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceType, setSourceType] = useState<'data' | 'table' | 'text'>('text');
  const [sourceError, setSourceError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [generateMessage, setGenerateMessage] = useState('');
  const [lastGeneratedDeliverableId, setLastGeneratedDeliverableId] = useState('');
  const [isGenerateSubmitting, setIsGenerateSubmitting] = useState(false);
  const [isSourceSubmitting, setIsSourceSubmitting] = useState(false);
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: `/api/sessions/${initialSession.id}/chat`,
      }),
  );
  const {
    data: sessionResult,
    error: sessionError,
    isLoading: isSessionLoading,
    mutate: mutateSession,
  } = useSWR(`/api/sessions/${initialSession.id}`, fetchSessionDetail, {
    fallbackData: {
      session: initialSession,
    },
  });
  const {
    error: chatError,
    messages,
    sendMessage,
    status,
    stop,
  } = useChat({
    id: initialSession.id,
    messages: createUiMessages(initialSession.messages),
    onFinish: () => {
      void mutateSession();
    },
    transport,
  });
  const currentSession = sessionResult?.session ?? initialSession;
  const latestDeliverable = currentSession.latestDeliverable;
  const recentReferences = currentSession.recentReferences;

  const handleChatInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(event.currentTarget.value);
  };

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (chatInput.trim().length === 0 || status !== 'ready') {
      return;
    }

    sendMessage({
      text: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleMethodologySuggestionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const methodologyName = event.currentTarget.dataset.methodologyName;

    if (!methodologyName) {
      return;
    }

    setChatInput(`${methodologyName} 프레임으로 같이 정리해볼게요. 필요한 질문부터 이어가주세요.`);
  };

  const handleSourceContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceContent(event.currentTarget.value);
  };

  const handleSourceLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSourceLabel(event.currentTarget.value);
  };

  const handleSourceTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.currentTarget.value;

    if (nextType === 'text' || nextType === 'table' || nextType === 'data') {
      setSourceType(nextType);
    }
  };

  const handleSourceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (sourceContent.trim().length === 0 || isSourceSubmitting) {
      return;
    }

    setIsSourceSubmitting(true);
    setSourceError('');

    const result = await safeFetch<SourceCreateResponse>(
      `/api/sessions/${initialSession.id}/source`,
      {
        body: JSON.stringify({
          content: sourceContent.trim(),
          label: sourceLabel.trim() || undefined,
          type: sourceType,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
    );

    setIsSourceSubmitting(false);

    if (!result.success) {
      setSourceError(result.error);
      return;
    }

    setSourceContent('');
    setSourceLabel('');
    await mutateSession();
  };

  const handleGenerateClick = async () => {
    if (!currentSession.canGenerate || isGenerateSubmitting || status !== 'ready') {
      return;
    }

    setIsGenerateSubmitting(true);
    setGenerateError('');
    setGenerateMessage('');

    const result = await safeFetch<GenerateDeliverableResponse>(
      `/api/sessions/${initialSession.id}/generate`,
      {
        method: 'POST',
      },
    );

    setIsGenerateSubmitting(false);

    if (!result.success) {
      setGenerateError(result.error);
      return;
    }

    setLastGeneratedDeliverableId(result.data.data.deliverable.id);
    setGenerateMessage(
      `${result.data.message} · ${result.data.data.deliverable.status} v${result.data.data.deliverable.version}`,
    );
    await mutateSession();
  };

  const handleGenerateButtonClick = () => {
    void handleGenerateClick();
  };

  const renderMessage = (message: UIMessage) => {
    const visibleText = getVisibleMessageText(message);
    const roleLabel = message.role === 'user' ? '담당자' : 'HARP';
    const toneClass =
      message.role === 'user'
        ? 'border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] text-[var(--color-text)]'
        : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)]';

    return (
      <article
        className={`rounded-[var(--radius-md)] border px-4 py-3 ${toneClass}`}
        key={message.id}
      >
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
          <span>{roleLabel}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{visibleText}</p>
      </article>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <section className="surface flex min-h-[780px] flex-col shadow-[var(--shadow-2)]">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="section-label">Canvas Chat</span>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                {currentSession.title}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {currentSession.template.name} · 대화 기반 산파술 인터뷰
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-neutral">{currentSession.status}</span>
              {status === 'streaming' || status === 'submitted' ? (
                <button
                  className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
                  onClick={stop}
                  type="button"
                >
                  응답 중지
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.map(renderMessage)}
        </div>

        <div className="border-t border-[var(--color-border)] px-6 py-5">
          {chatError || sessionError ? (
            <div className="border-[var(--color-error)]/20 mb-4 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
              {chatError?.message ?? sessionError?.message}
            </div>
          ) : null}

          <form className="flex flex-col gap-3" onSubmit={handleChatSubmit}>
            <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor="chat-input">
              질문이나 상황 설명
            </label>
            <textarea
              className="min-h-28 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              disabled={status !== 'ready'}
              id="chat-input"
              onChange={handleChatInputChange}
              placeholder="예: 이번 교육은 신임 리더 대상이었고, 만족도는 4.6점이었습니다."
              value={chatInput}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                한 번에 하나씩 답하면 HARP가 체크리스트를 추적합니다.
              </p>
              <button
                className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-[var(--color-text-inverse)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status !== 'ready' || chatInput.trim().length === 0}
                type="submit"
              >
                {status === 'ready' ? '보내기' : '응답 대기 중'}
              </button>
            </div>
          </form>

          <form
            className="mt-6 flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] p-4"
            onSubmit={handleSourceSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">근거자료 추가</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  복사/붙여넣기한 메모, 표, 수치를 세션에 저장합니다.
                </p>
              </div>
              <span className="badge badge-teal">{currentSession.sources.length}개 저장됨</span>
            </div>

            {sourceError.length > 0 ? (
              <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
                {sourceError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <input
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                onChange={handleSourceLabelChange}
                placeholder="자료 이름 (선택)"
                value={sourceLabel}
              />
              <select
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
                onChange={handleSourceTypeChange}
                value={sourceType}
              >
                <option value="text">텍스트</option>
                <option value="table">표</option>
                <option value="data">데이터</option>
              </select>
            </div>
            <textarea
              className="min-h-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              onChange={handleSourceContentChange}
              placeholder="예: 참여율 92%, 만족도 4.6/5, 사전·사후 테스트 점수 평균 17% 상승"
              value={sourceContent}
            />
            <div className="flex justify-end">
              <button
                className="rounded-full border border-[var(--color-teal)] bg-[var(--color-teal-light)] px-4 py-2 text-sm font-semibold text-[var(--color-teal)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSourceSubmitting || sourceContent.trim().length === 0}
                type="submit"
              >
                {isSourceSubmitting ? '저장 중...' : '자료 저장'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="flex min-h-[780px] flex-col gap-4">
        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">Checklist</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                산파술 진행 상태
              </h2>
            </div>
            <span className="badge badge-accent">
              {Object.values(currentSession.checklist).filter(Boolean).length} /{' '}
              {currentSession.template.checklist.length}
            </span>
          </div>

          <div className="grid gap-3">
            {currentSession.template.checklist.map((item) => {
              const isChecked = currentSession.checklist[item.id] === true;

              return (
                <div
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-4 py-3"
                  key={item.id}
                >
                  <span className={`badge mt-0.5 ${isChecked ? 'badge-success' : 'badge-neutral'}`}>
                    {isChecked ? '완료' : '대기'}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
                    <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                      {item.intent}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">Methodology</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                추천 프레임워크
              </h2>
            </div>
            <span className="badge badge-teal">
              {currentSession.canvas.methodologySuggestions.length}개
            </span>
          </div>

          <div className="grid gap-3">
            {currentSession.canvas.methodologySuggestions.map((methodology) => (
              <button
                className="border-[var(--color-teal)]/20 hover:border-[var(--color-teal)]/40 rounded-[var(--radius-md)] border bg-[var(--color-teal-light)] px-4 py-4 text-left transition"
                data-methodology-name={methodology.name}
                key={methodology.id}
                onClick={handleMethodologySuggestionClick}
                type="button"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {methodology.name}
                  </span>
                  <span className="badge badge-teal">{methodology.category}</span>
                </div>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {methodology.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">References</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                이전 참고 산출물
              </h2>
            </div>
            <span className="badge badge-neutral">{recentReferences.length}개</span>
          </div>

          {recentReferences.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              같은 유형의 이전 산출물이 아직 없습니다. 현재 세션이 첫 기준 문서가 됩니다.
            </p>
          ) : (
            <div className="grid gap-3">
              {recentReferences.map((reference) => (
                <Link
                  className="surface-interactive flex flex-col gap-2 p-4"
                  href={`/workspace/asset/${reference.id}`}
                  key={reference.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="badge badge-accent">{reference.status}</span>
                    <span className="badge badge-neutral">v{reference.version}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    {reference.title}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    {reference.preview}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="surface flex-1 p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">Document Canvas</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                {currentSession.canvas.title}
              </h2>
            </div>
            <button
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!currentSession.canGenerate || isGenerateSubmitting || status !== 'ready'}
              onClick={handleGenerateButtonClick}
              type="button"
            >
              {isGenerateSubmitting ? '정리 중...' : '정리하기'}
            </button>
          </div>

          {generateError.length > 0 ? (
            <div className="border-[var(--color-error)]/20 mb-4 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
              {generateError}
            </div>
          ) : null}
          {generateMessage.length > 0 ? (
            <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-sunken)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {generateMessage}
            </div>
          ) : null}
          {latestDeliverable || lastGeneratedDeliverableId.length > 0 ? (
            <article className="doc-card mb-4 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="section-label">Latest Draft</span>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    {latestDeliverable?.title ?? currentSession.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {latestDeliverable ? (
                    <>
                      <span className="badge badge-neutral">{latestDeliverable.status}</span>
                      <span className="badge badge-accent">v{latestDeliverable.version}</span>
                    </>
                  ) : null}
                  <Link
                    className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]"
                    href={`/workspace/asset/${latestDeliverable?.id ?? lastGeneratedDeliverableId}`}
                  >
                    산출물 보기
                  </Link>
                </div>
              </div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {latestDeliverable?.preview ?? '방금 생성한 초안을 확인할 수 있습니다.'}
              </p>
            </article>
          ) : null}

          {isSessionLoading ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              세션을 불러오는 중입니다...
            </p>
          ) : null}

          <div className="grid gap-4">
            {currentSession.canvas.sections.map((section) => (
              <article className="doc-card p-5" key={section.name}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    {section.name}
                  </h3>
                  <span
                    className={`badge ${section.status === 'complete' ? 'badge-success' : 'badge-neutral'}`}
                  >
                    {section.status === 'complete' ? '채워짐' : '대기'}
                  </span>
                </div>
                <p className="mb-3 text-xs leading-5 text-[var(--color-text-tertiary)]">
                  {section.description}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                  {section.content.length > 0 ? section.content : '아직 정리된 내용이 없습니다.'}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export { SessionCanvas };
export type { SessionCanvasProps };
