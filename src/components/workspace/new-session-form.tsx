'use client';

import { type ChangeEvent, type MouseEvent, type ReactElement, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { TemplateType } from '@/lib/db/schema';
import type {
  CreateSessionRequestBody,
  SessionSummary,
  SessionTemplateSummary,
} from '@/lib/sessions/types';
import { EXAMPLE_TEXT_MAX_LENGTH } from '@/lib/sessions/validators';
import { safeFetch } from '@/lib/utils';

interface NewSessionFormProps {
  templates: SessionTemplateSummary[];
}

interface CreateSessionResponse {
  data: {
    session: SessionSummary;
  };
}

function NewSessionForm({ templates }: NewSessionFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | null>(null);
  const selectedTemplate =
    templates.find((template) => template.type === selectedTemplateType) ?? null;

  async function handleSessionCreate(includeExample: boolean): Promise<void> {
    if (!selectedTemplateType) {
      return;
    }

    setIsCreating(true);
    setErrorMessage('');

    const requestBody: CreateSessionRequestBody = {
      templateType: selectedTemplateType,
    };

    if (includeExample && exampleText.trim().length > 0) {
      requestBody.exampleText = exampleText.trim();
    }

    const result = await safeFetch<CreateSessionResponse>('/api/sessions', {
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });

    if (!result.success) {
      setIsCreating(false);
      setErrorMessage(result.error);
      return;
    }

    router.push(`/workspace/session/${result.data.data.session.id}`);
  }

  function handleExampleConfirm(): void {
    void handleSessionCreate(true);
  }

  function handleExampleSkip(): void {
    void handleSessionCreate(false);
  }

  function handleExampleTextChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setExampleText(event.target.value);
  }

  function handleTemplateDeselect(): void {
    setErrorMessage('');
    setExampleText('');
    setSelectedTemplateType(null);
  }

  function handleTemplateSelect(event: MouseEvent<HTMLButtonElement>): void {
    const templateType = event.currentTarget.dataset.templateType as TemplateType | undefined;

    if (!templateType) {
      return;
    }

    setErrorMessage('');
    setExampleText('');
    setSelectedTemplateType(templateType);
  }

  function renderTemplateCard(template: SessionTemplateSummary): ReactElement {
    const isSelected = selectedTemplateType === template.type;
    const isDisabled = selectedTemplateType !== null && !isSelected;

    return (
      <button
        className={`workspace-card group flex h-full flex-col p-6 text-left transition-all ${
          isSelected
            ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
            : 'hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-lg'
        } ${isDisabled ? 'opacity-40' : ''}`}
        data-template-type={template.type}
        disabled={isCreating || isDisabled}
        key={template.type}
        onClick={handleTemplateSelect}
        type="button"
      >
        <div className="mb-4 flex w-full items-start justify-between gap-3">
          <span
            className={`meta rounded border px-2 py-1 uppercase tracking-widest ${isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'border-[var(--color-border-strong)] bg-[var(--color-bg-sunken)]'}`}
          >
            {template.badge.label}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-bg-sunken)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            {`${template.estimatedMinutes} min`}
          </span>
        </div>

        <h3
          className={`font-headline mb-2 text-lg font-bold transition-colors group-hover:text-[var(--color-accent)] ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}
        >
          {template.name}
        </h3>
        <p className="mb-6 flex-grow text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {template.description}
        </p>

        <div className="w-full border-t border-[var(--color-border-subtle)] pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Sections Included
          </p>
          <div className="flex flex-wrap gap-2">
            {template.exampleTags.map((tag) => (
              <span
                className="rounded border border-[var(--color-border)] bg-[var(--color-bg-sunken)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {errorMessage.length > 0 ? (
        <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {templates.map(renderTemplateCard)}
      </div>

      {selectedTemplate ? (
        <div className="workspace-card-muted mt-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                참고할 예시 문서가 있나요?
              </h3>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                이전에 쓰셨던 비슷한 보고서를 붙여넣으시면 스타일을 맞춰드립니다. 없으면 건너뛰셔도
                됩니다.
              </p>
            </div>

            <button
              className="text-sm font-semibold text-[var(--color-text-secondary)] underline underline-offset-4 transition hover:text-[var(--color-accent)]"
              disabled={isCreating}
              onClick={handleTemplateDeselect}
              type="button"
            >
              다른 템플릿 고르기
            </button>
          </div>

          <textarea
            className="input-surface mb-4 min-h-[180px] w-full resize-none placeholder:text-[var(--color-text-tertiary)]"
            disabled={isCreating}
            maxLength={EXAMPLE_TEXT_MAX_LENGTH}
            onChange={handleExampleTextChange}
            placeholder="예시 보고서 텍스트를 붙여넣어 주세요. 이전 보고서, 메일 초안, 정리해 둔 문단이어도 괜찮습니다."
            value={exampleText}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
              {`${exampleText.length.toLocaleString()} / ${EXAMPLE_TEXT_MAX_LENGTH.toLocaleString()}자`}
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn-secondary"
                disabled={isCreating}
                onClick={handleExampleSkip}
                type="button"
              >
                건너뛰고 시작
              </button>
              <button
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCreating || exampleText.trim().length === 0}
                onClick={handleExampleConfirm}
                type="button"
              >
                {isCreating ? '생성 중...' : '이 예시로 시작'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { NewSessionForm };
export type { NewSessionFormProps };
