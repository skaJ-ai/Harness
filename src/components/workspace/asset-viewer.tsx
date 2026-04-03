'use client';

import { useState, type ChangeEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { reconstructDeliverableMarkdown } from '@/lib/deliverables/parser';
import type { DeliverableDetail, DeliverableTone } from '@/lib/deliverables/types';
import { safeFetch } from '@/lib/utils';

interface AssetViewerProps {
  initialDeliverable: DeliverableDetail;
}

interface DeliverableDetailResponse {
  data: {
    deliverable: DeliverableDetail;
  };
}

interface ConvertToneResponse {
  data: {
    deliverable: DeliverableDetail;
  };
  message: string;
}

const TONE_OPTIONS: { label: string; value: DeliverableTone }[] = [
  { label: '경영진 보고용', value: 'executive' },
  { label: '실무용', value: 'working' },
  { label: '발표용', value: 'presentation' },
];

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
  const router = useRouter();
  const [deliverable, setDeliverable] = useState(initialDeliverable);
  const [copyMessage, setCopyMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isToneConverting, setIsToneConverting] = useState(false);
  const [toneError, setToneError] = useState('');

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(deliverable.renderMarkdown);
      setCopyMessage('Markdown을 복사했습니다.');
    } catch {
      setCopyMessage('복사에 실패했습니다.');
    }
  };

  const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|]/g;
  const sanitizedTitle = deliverable.title.replace(UNSAFE_FILENAME_CHARS, '_');

  const handleDocxDownloadClick = () => {
    const anchor = document.createElement('a');
    anchor.href = `/api/deliverables/${deliverable.id}/export?format=docx`;
    anchor.download = `${sanitizedTitle}.docx`;
    anchor.click();
  };

  const handleDownloadClick = () => {
    const blob = new Blob([deliverable.renderMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizedTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleEditClick = () => {
    setEditContent(deliverable.renderMarkdown);
    setEditError('');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setEditError('');
  };

  const handleEditContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(event.currentTarget.value);
  };

  const handleEditSave = async () => {
    if (isEditSaving) {
      return;
    }

    setIsEditSaving(true);
    setEditError('');

    const reconstructedMarkdown = reconstructDeliverableMarkdown(editContent, deliverable.sections);

    const result = await safeFetch<DeliverableDetailResponse>(
      `/api/deliverables/${deliverable.id}`,
      {
        body: JSON.stringify({
          markdown: reconstructedMarkdown,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PATCH',
      },
    );

    setIsEditSaving(false);

    if (!result.success) {
      setEditError(result.error);
      return;
    }

    setDeliverable(result.data.data.deliverable);
    setIsEditing(false);
    setEditContent('');
  };

  const handleToneConvert = async (tone: DeliverableTone) => {
    if (isToneConverting) {
      return;
    }

    setIsToneConverting(true);
    setToneError('');

    const result = await safeFetch<ConvertToneResponse>(
      `/api/deliverables/${deliverable.id}/convert-tone`,
      {
        body: JSON.stringify({ tone }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
    );

    setIsToneConverting(false);

    if (!result.success) {
      setToneError(result.error);
      return;
    }

    router.push(`/workspace/asset/${result.data.data.deliverable.id}`);
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
      <section className="surface p-6 shadow-[var(--shadow-2)] lg:p-8">
        <div className="mb-6 flex flex-col gap-5 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-neutral">{deliverable.status}</span>
            <span className="badge badge-accent">v{deliverable.version}</span>
            <span className="badge badge-teal">{deliverable.templateName}</span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="meta">Deliverable Markdown</p>
              <h1 className="text-3xl font-bold text-[var(--color-text)]">{deliverable.title}</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                최종 업데이트: {deliverable.updatedAt.slice(0, 16).replace('T', ' ')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary focus-ring" onClick={handleCopyClick} type="button">
                Markdown 전체 복사
              </button>
              <button
                className="btn-secondary focus-ring"
                onClick={handleDownloadClick}
                type="button"
              >
                다운로드
              </button>
              <button
                className="btn-secondary focus-ring"
                onClick={handleDocxDownloadClick}
                type="button"
              >
                DOCX 다운로드
              </button>
              {deliverable.status === 'draft' && !isEditing ? (
                <button
                  className="btn-secondary focus-ring"
                  onClick={handleEditClick}
                  type="button"
                >
                  편집
                </button>
              ) : null}
              {deliverable.sessionId ? (
                <Link
                  className="btn-secondary focus-ring"
                  href={`/workspace/session/${deliverable.sessionId}`}
                >
                  캔버스로 돌아가기
                </Link>
              ) : null}
            </div>
          </div>
          {copyMessage.length > 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{copyMessage}</p>
          ) : null}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-4">
            {editError.length > 0 ? (
              <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
                {editError}
              </div>
            ) : null}

            <textarea
              className="input-surface min-h-[480px] resize-y font-mono text-sm leading-6"
              onChange={handleEditContentChange}
              value={editContent}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                className="btn-secondary focus-ring"
                disabled={isEditSaving}
                onClick={handleEditCancel}
                type="button"
              >
                취소
              </button>
              <button
                className="btn-primary focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isEditSaving || editContent.trim().length === 0}
                onClick={() => void handleEditSave()}
                type="button"
              >
                {isEditSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{deliverable.renderMarkdown}</ReactMarkdown>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="meta">Back Guard</p>
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
                    {section.cited ? '근거 기반' : 'AI 생성 포함'}
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
              <p className="meta">Tone Conversion</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">톤 변환</h2>
            </div>
          </div>

          <p className="mb-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            현재 산출물을 다른 톤으로 변환합니다. 원본은 보존되고 새 산출물이 생성됩니다.
          </p>

          {toneError.length > 0 ? (
            <div className="border-[var(--color-error)]/20 mb-3 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
              {toneError}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {TONE_OPTIONS.map((option) => (
              <button
                className="btn-secondary focus-ring text-left disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isToneConverting}
                key={option.value}
                onClick={() => void handleToneConvert(option.value)}
                type="button"
              >
                {isToneConverting ? '변환 중...' : option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-6 shadow-[var(--shadow-2)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="meta">Status Transition</p>
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
                className="btn-teal focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isStatusSubmitting}
                onClick={handleFinalizeClick}
                type="button"
              >
                {isStatusSubmitting ? '처리 중...' : 'final로 확정'}
              </button>
            ) : null}
            {canPromote ? (
              <button
                className="btn-secondary focus-ring border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
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
