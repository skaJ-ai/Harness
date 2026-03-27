'use client';

import { useState } from 'react';

import Link from 'next/link';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { DeliverableDetail } from '@/lib/deliverables/types';
import { safeFetch } from '@/lib/utils';

interface AssetViewerProps {
  initialDeliverable: DeliverableDetail;
}

interface DeliverableDetailResponse {
  data: {
    deliverable: DeliverableDetail;
  };
}

function getConfidenceBadgeClass(confidence: DeliverableDetail['sections'][number]['confidence']) {
  if (confidence === 'high') {
    return 'badge-success';
  }

  if (confidence === 'medium') {
    return 'badge-accent';
  }

  return 'badge-neutral';
}

function getConfidenceLabel(confidence: DeliverableDetail['sections'][number]['confidence']) {
  if (confidence === 'high') {
    return 'confidence 높음';
  }

  if (confidence === 'medium') {
    return 'confidence 중간';
  }

  return 'confidence 낮음';
}

function AssetViewer({ initialDeliverable }: AssetViewerProps) {
  const [deliverable, setDeliverable] = useState(initialDeliverable);
  const [copyMessage, setCopyMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(deliverable.markdown);
      setCopyMessage('Markdown을 복사했습니다.');
    } catch {
      setCopyMessage('복사에 실패했습니다.');
    }
  };

  const handleStatusTransitionClick = async (nextStatus: DeliverableDetail['status']) => {
    setIsStatusSubmitting(true);
    setStatusError('');
    setStatusMessage('');

    const result = await safeFetch<DeliverableDetailResponse>(
      `/api/deliverables/${deliverable.id}`,
      {
        body: JSON.stringify({
          status: nextStatus,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      },
    );

    setIsStatusSubmitting(false);

    if (!result.success) {
      setStatusError(result.error);
      return;
    }

    setDeliverable(result.data.data.deliverable);
    setStatusMessage('산출물 상태를 업데이트했습니다.');
  };

  const handleFinalizeClick = () => {
    void handleStatusTransitionClick('final');
  };

  const handlePromoteClick = () => {
    void handleStatusTransitionClick('promoted_asset');
  };

  const canFinalize = deliverable.status === 'draft';
  const canPromote = deliverable.status === 'final';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
      <section className="surface p-6 shadow-[var(--shadow-2)]">
        <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-label">Deliverable</span>
            <span className="badge badge-neutral">{deliverable.status}</span>
            <span className="badge badge-accent">v{deliverable.version}</span>
            <span className="badge badge-teal">{deliverable.templateName}</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{deliverable.title}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              최종 업데이트: {deliverable.updatedAt.slice(0, 16).replace('T', ' ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-text-inverse)]"
              onClick={handleCopyClick}
              type="button"
            >
              Markdown 전체 복사
            </button>
            {deliverable.sessionId ? (
              <Link
                className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
                href={`/workspace/session/${deliverable.sessionId}`}
              >
                캔버스로 돌아가기
              </Link>
            ) : null}
            {copyMessage.length > 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">{copyMessage}</p>
            ) : null}
          </div>
        </div>

        <div className="prose prose-slate prose-headings:text-[var(--color-text)] prose-p:text-[var(--color-text-secondary)] max-w-none text-[var(--color-text)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{deliverable.renderMarkdown}</ReactMarkdown>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">Back Guard</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                섹션별 confidence
              </h2>
            </div>
            <span className="badge badge-neutral">{deliverable.sections.length}개 섹션</span>
          </div>

          <div className="grid gap-4">
            {deliverable.sections.map((section) => (
              <article className="doc-card p-5" key={section.name}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="mr-auto text-base font-semibold text-[var(--color-text)]">
                    {section.name}
                  </h3>
                  <span className={`badge ${getConfidenceBadgeClass(section.confidence)}`}>
                    {getConfidenceLabel(section.confidence)}
                  </span>
                  <span className={`badge ${section.cited ? 'badge-success' : 'badge-neutral'}`}>
                    {section.cited ? '근거 있음' : '추정 포함'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                  {section.content.length > 0 ? section.content : '작성된 내용이 없습니다.'}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-label">Actions</span>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">상태 전이</h2>
            </div>
            <span className="badge badge-accent">{deliverable.status}</span>
          </div>

          {statusError.length > 0 ? (
            <div className="border-[var(--color-error)]/20 mb-3 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
              {statusError}
            </div>
          ) : null}
          {statusMessage.length > 0 ? (
            <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-sunken)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {statusMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {canFinalize ? (
              <button
                className="rounded-full bg-[var(--color-teal)] px-5 py-3 text-sm font-semibold text-[var(--color-text-inverse)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isStatusSubmitting}
                onClick={handleFinalizeClick}
                type="button"
              >
                {isStatusSubmitting ? '처리 중...' : 'final로 확정'}
              </button>
            ) : null}
            {canPromote ? (
              <button
                className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-light)] px-5 py-3 text-sm font-semibold text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isStatusSubmitting}
                onClick={handlePromoteClick}
                type="button"
              >
                {isStatusSubmitting ? '처리 중...' : '자산으로 승격'}
              </button>
            ) : null}
            {!canFinalize && !canPromote ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                이 산출물은 이미 최종 자산 상태입니다.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export { AssetViewer };
export type { AssetViewerProps };
