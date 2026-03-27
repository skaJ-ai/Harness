'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import type { SessionSummary, SessionTemplateSummary } from '@/lib/sessions/types';
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
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>(null);

  const handleTemplateSelect = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const templateType = event.currentTarget.dataset.templateType;

    if (!templateType) {
      return;
    }

    setSelectedTemplateType(templateType);
    setErrorMessage('');

    const result = await safeFetch<CreateSessionResponse>('/api/sessions', {
      body: JSON.stringify({
        templateType,
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });

    if (!result.success) {
      setSelectedTemplateType(null);
      setErrorMessage(result.error);
      return;
    }

    router.push(`/workspace/session/${result.data.data.session.id}`);
  };

  return (
    <section className="surface flex flex-col gap-6 p-8 shadow-[var(--shadow-2)]">
      <div className="flex flex-col gap-2">
        <span className="section-label">New Session</span>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">어떤 산출물을 만들까요?</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          표준 템플릿을 고르면 AI가 먼저 질문을 시작하고, 우측 캔버스가 함께 채워집니다.
        </p>
      </div>

      {errorMessage.length > 0 ? (
        <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {templates.map((template) => {
          const hasSelectedTemplate = selectedTemplateType === template.type;

          return (
            <button
              className="surface-interactive flex h-full flex-col items-start gap-4 p-6 text-left"
              data-template-type={template.type}
              disabled={selectedTemplateType !== null}
              key={template.type}
              onClick={handleTemplateSelect}
              type="button"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <span className="badge badge-accent">{template.type}</span>
                  <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    {template.name}
                  </h2>
                </div>
                <span className="badge badge-neutral">{template.estimatedMinutes}분</span>
              </div>

              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {template.description}
              </p>

              <ul className="flex flex-col gap-2 text-sm text-[var(--color-text-secondary)]">
                {template.sections.slice(0, 3).map((section) => (
                  <li key={section.name}>• {section.name}</li>
                ))}
              </ul>

              <div className="mt-auto flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
                <span>{hasSelectedTemplate ? '생성 중...' : '이 템플릿으로 시작'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { NewSessionForm };
export type { NewSessionFormProps };
