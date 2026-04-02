'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';

import Link from 'next/link';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import useSWR from 'swr';

import type { DeliverableDetail, DeliverableSummary } from '@/lib/deliverables/types';
import type {
  SessionCanvasSection,
  SessionChatMessage,
  SessionDetail,
  SessionMethodologySuggestion,
  SessionSourceSummary,
} from '@/lib/sessions/types';
import type { TemplateChecklistItem } from '@/lib/templates';
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

type CanvasTab = 'canvas' | 'references' | 'tools';

type GuidanceCtaAction = 'focus_chat' | 'switch_tab_sources';
type GuidanceKind = 'first_deliverable' | 'high_weight_gap' | 'many_empty_sections' | 'no_sources';
type GuidancePriority = 'high' | 'low' | 'medium';

interface GuidanceItem {
  ctaAction?: GuidanceCtaAction;
  ctaLabel?: string;
  description: string;
  kind: GuidanceKind;
  priority: GuidancePriority;
  title: string;
}

const GUIDANCE_EMPTY_SECTION_RATIO_THRESHOLD = 0.5;
const GUIDANCE_HIGH_WEIGHT_THRESHOLD = 3;
const GUIDANCE_MAX_VISIBLE_ITEMS = 3;
const GUIDANCE_PRIORITY_ORDER: Record<GuidancePriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const PREVIEW_SECTION_CONTENT_MAX_LENGTH = 120;
const READINESS_PARTIAL_GENERATE_THRESHOLD = 70;
const SIDEBAR_WIDTH_STORAGE_KEY = 'harp-session-sidebar-width';
const SIDEBAR_MIN_WIDTH = 320;
const SIDEBAR_MAX_WIDTH = 520;
const MIN_MAIN_PANEL_WIDTH = 720;

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

function getReadinessColor(percent: number): string {
  if (percent >= 100) {
    return 'var(--color-success)';
  }

  if (percent >= READINESS_PARTIAL_GENERATE_THRESHOLD) {
    return 'var(--color-teal)';
  }

  if (percent >= 50) {
    return 'var(--color-warning)';
  }

  return 'var(--color-error)';
}

function getReadinessMessage(percent: number): string {
  if (percent >= 100) {
    return '모든 항목이 채워졌습니다';
  }

  if (percent >= READINESS_PARTIAL_GENERATE_THRESHOLD) {
    return '지금 초안을 정리할 수 있습니다';
  }

  if (percent >= 50) {
    return '핵심 항목이 조금 더 필요합니다';
  }

  return '핵심 항목이 부족합니다';
}

function getReadinessBadgeClassName(percent: number): string {
  if (percent >= 100) {
    return 'badge-success';
  }

  if (percent >= READINESS_PARTIAL_GENERATE_THRESHOLD) {
    return 'badge-teal';
  }

  if (percent >= 50) {
    return 'badge-warning';
  }

  return 'badge-error';
}

function getPreviewSectionContent(content: string): string {
  if (content.length === 0) {
    return '수집된 내용 없음 — 추정으로 작성됩니다';
  }

  if (content.length <= PREVIEW_SECTION_CONTENT_MAX_LENGTH) {
    return content;
  }

  return `${content.slice(0, PREVIEW_SECTION_CONTENT_MAX_LENGTH)}...`;
}

function getSectionStatusBadgeClassName(status: SessionCanvasSection['status']): string {
  return status === 'complete' ? 'badge-success' : 'badge-neutral';
}

function getSectionStatusLabel(status: SessionCanvasSection['status']): string {
  return status === 'complete' ? '채워짐' : '대기';
}

function renderChecklistWeightDots(weight: number, isChecked: boolean): ReactElement[] {
  const dotToneClassName = isChecked ? 'status-dot-success' : 'status-dot-neutral';

  return Array.from({ length: weight }, (_, dotIndex) => (
    <span className={`status-dot ${dotToneClassName}`} key={`weight-dot-${weight}-${dotIndex}`} />
  ));
}

function renderWorkspaceEmptyState({
  description,
  eyebrow,
  mark,
  title,
}: {
  description: string;
  eyebrow: string;
  mark: string;
  title: string;
}): ReactElement {
  return (
    <div className="workspace-empty-state" data-mark={mark}>
      <p className="meta mb-2">{eyebrow}</p>
      <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function computeGuidanceItems(session: SessionDetail): GuidanceItem[] {
  const items: GuidanceItem[] = [];

  const highWeightGaps = session.template.checklist.filter(
    (item) => item.weight >= GUIDANCE_HIGH_WEIGHT_THRESHOLD && session.checklist[item.id] !== true,
  );

  for (const gap of highWeightGaps) {
    items.push({
      ctaAction: 'focus_chat',
      ctaLabel: '인터뷰 이어가기',
      description: gap.helpText,
      kind: 'high_weight_gap',
      priority: 'high',
      title: `${gap.label} 항목이 비어 있습니다`,
    });
  }

  if (session.sources.length === 0) {
    items.push({
      ctaAction: 'switch_tab_sources',
      ctaLabel: '자료 추가하기',
      description: '관련 데이터나 문서를 추가하면 초안 품질이 높아집니다.',
      kind: 'no_sources',
      priority: 'medium',
      title: '근거자료가 아직 없습니다',
    });
  }

  const totalSections = session.canvas.sections.length;
  const emptySections = session.canvas.sections.filter((section) => section.status === 'empty');

  if (
    totalSections > 0 &&
    emptySections.length / totalSections > GUIDANCE_EMPTY_SECTION_RATIO_THRESHOLD
  ) {
    items.push({
      ctaAction: 'focus_chat',
      ctaLabel: '인터뷰 이어가기',
      description: '인터뷰를 이어가면 HARP가 자동으로 채워갑니다.',
      kind: 'many_empty_sections',
      priority: 'medium',
      title: `캔버스의 ${emptySections.length}개 섹션이 아직 비어 있습니다`,
    });
  }

  if (session.recentReferences.length === 0) {
    items.push({
      description: '이번 초안이 다음부터 참고 기준이 됩니다.',
      kind: 'first_deliverable',
      priority: 'low',
      title: '이 유형의 첫 산출물입니다',
    });
  }

  items.sort((a, b) => GUIDANCE_PRIORITY_ORDER[a.priority] - GUIDANCE_PRIORITY_ORDER[b.priority]);

  return items.slice(0, GUIDANCE_MAX_VISIBLE_ITEMS);
}

function SessionCanvas({ initialSession }: SessionCanvasProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('canvas');
  const [chatInput, setChatInput] = useState('');
  const [dismissedGuidanceKinds, setDismissedGuidanceKinds] = useState<string[]>([]);
  const [expandedHelpItemId, setExpandedHelpItemId] = useState<string | null>(null);
  const [sourceContent, setSourceContent] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceType, setSourceType] = useState<'data' | 'table' | 'text'>('text');
  const [sourceError, setSourceError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [generateMessage, setGenerateMessage] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastGeneratedDeliverableId, setLastGeneratedDeliverableId] = useState('');
  const [isGenerateSubmitting, setIsGenerateSubmitting] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isSourceSubmitting, setIsSourceSubmitting] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploadMessage, setFileUploadMessage] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

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
  const hasLatestDeliverable = Boolean(latestDeliverable) || lastGeneratedDeliverableId.length > 0;
  const readinessPercent = currentSession.readinessPercent;
  const readinessBadgeClassName = getReadinessBadgeClassName(readinessPercent);
  const readinessMessage = getReadinessMessage(readinessPercent);
  const readinessBarStyle = {
    backgroundColor: getReadinessColor(readinessPercent),
    width: `${readinessPercent}%`,
  };
  const completedChecklistCount = Object.values(currentSession.checklist).filter(Boolean).length;
  const guidanceItems =
    currentSession.status === 'completed'
      ? []
      : computeGuidanceItems(currentSession).filter(
          (item) => !dismissedGuidanceKinds.includes(item.kind),
        );
  const isCanvasTabActive = activeTab === 'canvas';
  const isToolsTabActive = activeTab === 'tools';
  const isReferencesTabActive = activeTab === 'references';
  const hasEmptyPreviewSections = currentSession.canvas.sections.some(
    (section) => section.status === 'empty',
  );
  const isPartialGenerateAvailable =
    readinessPercent >= READINESS_PARTIAL_GENERATE_THRESHOLD && !currentSession.canGenerate;
  const isChatBusy = status === 'streaming' || status === 'submitted';
  const latestDraftPreview =
    latestDeliverable?.preview ??
    '아직 생성된 초안이 없습니다. 준비도가 70%를 넘으면 프리뷰 후 초안을 만들 수 있습니다.';
  const readinessHint =
    readinessPercent >= READINESS_PARTIAL_GENERATE_THRESHOLD
      ? '70%를 넘으면 부족한 항목이 남아 있어도 초안 생성을 진행할 수 있습니다.'
      : '현황, 목적, 근거 같은 핵심 항목이 먼저 채워지면 초안 품질이 안정됩니다.';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);

    if (!storedWidth) {
      return;
    }

    const parsedWidth = Number(storedWidth);

    if (!Number.isFinite(parsedWidth)) {
      return;
    }

    setSidebarWidth(Math.min(Math.max(parsedWidth, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizingSidebar) {
      return;
    }

    const handlePointerMove = (event: MouseEvent) => {
      const workspace = workspaceRef.current;

      if (!workspace) {
        return;
      }

      const rect = workspace.getBoundingClientRect();
      const maxAllowedWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(SIDEBAR_MAX_WIDTH, rect.width - MIN_MAIN_PANEL_WIDTH),
      );
      const nextWidth = rect.right - event.clientX;
      const clampedWidth = Math.min(Math.max(nextWidth, SIDEBAR_MIN_WIDTH), maxAllowedWidth);

      setSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      setIsResizingSidebar(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isResizingSidebar]);

  const handleCanvasTabClick = () => {
    setActiveTab('canvas');
  };

  const handleToolsTabClick = () => {
    setActiveTab('tools');
  };

  const handleReferencesTabClick = () => {
    setActiveTab('references');
  };

  const handleChatInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(event.currentTarget.value);
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (chatInput.trim().length === 0 || status !== 'ready') {
      return;
    }

    sendMessage({
      text: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleChecklistAskClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const itemLabel = event.currentTarget.dataset.itemLabel;

    if (!itemLabel) {
      return;
    }

    setChatInput(`"${itemLabel}" 항목이 정확히 뭘 말하는 건지 설명해 주세요.`);
  };

  const handleChecklistHelpToggle = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const itemId = event.currentTarget.dataset.itemId;

    if (!itemId) {
      return;
    }

    setExpandedHelpItemId((previousId) => (previousId === itemId ? null : itemId));
  };

  const handleMethodologySuggestionClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const methodologyName = event.currentTarget.dataset.methodologyName;

    if (!methodologyName) {
      return;
    }

    setChatInput(`${methodologyName} 프레임으로 같이 정리해볼게요. 필요한 질문부터 이어가주세요.`);
  };

  const handleSourceContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setSourceContent(event.currentTarget.value);
  };

  const handleSourceLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSourceLabel(event.currentTarget.value);
  };

  const handleSourceTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.currentTarget.value;

    if (nextType === 'text' || nextType === 'table' || nextType === 'data') {
      setSourceType(nextType);
    }
  };

  const handleSourceSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setIsFileUploading(true);
    setFileUploadError('');
    setFileUploadMessage('');

    const formData = new FormData();
    formData.append('file', file);

    const result = await safeFetch<{ message: string }>(
      `/api/sessions/${initialSession.id}/upload`,
      {
        body: formData,
        method: 'POST',
      },
    );

    setIsFileUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!result.success) {
      setFileUploadError(result.error);
      return;
    }

    setFileUploadMessage(result.data.message);
    await mutateSession();
  };

  const handleGenerateClick = async () => {
    if (currentSession.readinessPercent < READINESS_PARTIAL_GENERATE_THRESHOLD) {
      return;
    }

    if (isGenerateSubmitting || status !== 'ready') {
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

  const handleGeneratePreviewCancel = () => {
    setIsPreviewMode(false);
  };

  const handleGeneratePreviewConfirm = () => {
    setIsPreviewMode(false);
    void handleGenerateClick();
  };

  const handleGeneratePreviewOpen = () => {
    if (currentSession.readinessPercent < READINESS_PARTIAL_GENERATE_THRESHOLD) {
      return;
    }

    if (isGenerateSubmitting || status !== 'ready') {
      return;
    }

    setIsPreviewMode(true);
  };

  const handleGuidanceCtaClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const action = event.currentTarget.dataset.guidanceAction;

    if (action === 'focus_chat') {
      document.getElementById('chat-input')?.focus();
    }

    if (action === 'switch_tab_sources') {
      setActiveTab('tools');
    }
  };

  const handleGuidanceDismiss = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const kind = event.currentTarget.dataset.guidanceKind;

    if (kind) {
      setDismissedGuidanceKinds((previous) => [...previous, kind]);
    }
  };

  const handleSidebarResizeStart = () => {
    setIsResizingSidebar(true);
  };

  const renderGuidanceCard = (item: GuidanceItem) => {
    const priorityBadgeClassName =
      item.priority === 'high'
        ? 'badge-error'
        : item.priority === 'medium'
          ? 'badge-warning'
          : 'badge-neutral';

    return (
      <div
        className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3"
        key={item.kind}
      >
        <span className={`badge mt-0.5 shrink-0 ${priorityBadgeClassName}`}>
          {item.priority === 'high' ? '중요' : item.priority === 'medium' ? '참고' : '안내'}
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)]">{item.description}</p>
          {item.ctaLabel ? (
            <button
              className="mt-1 self-start text-xs font-semibold text-[var(--color-accent)] hover:underline"
              data-guidance-action={item.ctaAction}
              onClick={handleGuidanceCtaClick}
              type="button"
            >
              {item.ctaLabel}
            </button>
          ) : null}
        </div>
        <button
          className="shrink-0 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          data-guidance-kind={item.kind}
          onClick={handleGuidanceDismiss}
          type="button"
        >
          닫기
        </button>
      </div>
    );
  };

  const renderMessage = (message: UIMessage) => {
    const visibleText = getVisibleMessageText(message);

    if (message.role === 'user') {
      return (
        <div className="flex justify-end" key={message.id}>
          <article className="max-w-[92%] rounded-[18px] rounded-tr-[6px] bg-[var(--color-accent)] px-4 py-3 text-sm leading-6 text-[var(--color-text-inverse)] shadow-[var(--shadow-1)]">
            <p className="text-white/72 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
              담당자
            </p>
            <p className="whitespace-pre-wrap">{visibleText}</p>
          </article>
        </div>
      );
    }

    return (
      <div className="flex gap-3" key={message.id}>
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-light)] text-xs font-bold text-[var(--color-teal)]">
          H
        </div>
        <article className="max-w-[95%] rounded-[18px] rounded-tl-[6px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-1)]">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
            HARP
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
            {visibleText}
          </p>
        </article>
      </div>
    );
  };

  const renderSectionCard = (section: SessionCanvasSection) => {
    const isComplete = section.status === 'complete';

    return (
      <article className="workspace-card flex flex-col gap-3" key={section.name}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
              {section.name}
            </h3>
            <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
              {section.description}
            </p>
          </div>
          <span className={`badge ${getSectionStatusBadgeClassName(section.status)}`}>
            {getSectionStatusLabel(section.status)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
          {isComplete ? section.content : section.content || '아직 정리된 내용이 없습니다.'}
        </p>
      </article>
    );
  };

  const renderPreviewSection = (section: SessionCanvasSection) => {
    const isComplete = section.status === 'complete';

    return (
      <div
        className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3"
        key={section.name}
      >
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{section.name}</p>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
            {getPreviewSectionContent(section.content)}
          </p>
        </div>
        <span className={`badge ${isComplete ? 'badge-success' : 'badge-warning'}`}>
          {isComplete ? '준비됨' : '추정'}
        </span>
      </div>
    );
  };

  const renderChecklistItem = (item: TemplateChecklistItem) => {
    const isChecked = currentSession.checklist[item.id] === true;
    const isHelpExpanded = expandedHelpItemId === item.id;

    return (
      <article className="workspace-card flex flex-col gap-3" key={item.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <span className={`badge mt-0.5 ${isChecked ? 'badge-success' : 'badge-neutral'}`}>
              {isChecked ? '완료' : '대기'}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">{item.intent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {renderChecklistWeightDots(item.weight, isChecked)}
            </div>
            <button
              className="text-xs font-medium text-[var(--color-text-tertiary)] transition hover:text-[var(--color-accent)]"
              data-item-id={item.id}
              onClick={handleChecklistHelpToggle}
              type="button"
            >
              {isHelpExpanded ? '접기' : '도움말'}
            </button>
          </div>
        </div>

        {isHelpExpanded ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)] px-4 py-3">
            <p className="mb-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              {item.helpText}
            </p>
            <button
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
              data-item-label={item.label}
              onClick={handleChecklistAskClick}
              type="button"
            >
              이 항목에 대해 HARP에게 물어보기
            </button>
          </div>
        ) : null}
      </article>
    );
  };

  const renderMethodologyCard = (methodology: SessionMethodologySuggestion) => {
    return (
      <button
        className="workspace-card-muted hover:border-[var(--color-teal)]/40 flex flex-col gap-2 text-left transition"
        data-methodology-name={methodology.name}
        key={methodology.id}
        onClick={handleMethodologySuggestionClick}
        type="button"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">{methodology.name}</span>
          <span className="badge badge-teal">{methodology.category}</span>
        </div>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {methodology.description}
        </p>
      </button>
    );
  };

  const renderReferenceCard = (reference: DeliverableSummary) => {
    return (
      <Link
        className="workspace-card flex flex-col gap-3 transition hover:border-[var(--color-border-strong)]"
        href={`/workspace/asset/${reference.id}`}
        key={reference.id}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="badge badge-accent">{reference.status}</span>
          <span className="badge badge-neutral">v{reference.version}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{reference.title}</h3>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {reference.preview}
          </p>
        </div>
      </Link>
    );
  };

  const renderSourceItem = (source: SessionSourceSummary) => {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-3"
        key={source.id}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral">{source.type ?? 'text'}</span>
            {source.label ? (
              <span className="text-sm font-semibold text-[var(--color-text)]">{source.label}</span>
            ) : (
              <span className="text-sm font-semibold text-[var(--color-text)]">이름 없는 자료</span>
            )}
          </div>
          <span className="meta">{new Date(source.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {source.content}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch" ref={workspaceRef}>
      <section className="surface flex min-h-[760px] min-w-0 flex-1 flex-col overflow-hidden shadow-[var(--shadow-2)] xl:h-[calc(100vh-12rem)]">
        <div className="shrink-0 border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-3">
                <span className="section-label">Workspace</span>
                <div className="flex flex-col gap-2">
                  <h2 className="font-headline text-2xl font-bold tracking-tight text-[var(--color-text)]">
                    {currentSession.canvas.title}
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                    인터뷰 답변과 근거자료를 바탕으로 초안을 단계적으로 채웁니다. 보조 정보는 필요한
                    탭에서만 열고, 현재 문서 흐름은 중앙에서 유지합니다.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="process-flow">
                    <span>Template</span>
                    <span className="current">{currentSession.template.name}</span>
                  </span>
                  <span className={`badge ${readinessBadgeClassName}`}>
                    {readinessPercent}% 준비
                  </span>
                  <span className="badge badge-neutral">
                    체크리스트 {completedChecklistCount}/{currentSession.template.checklist.length}
                  </span>
                  <span className="badge badge-neutral">
                    자료 {currentSession.sources.length}개
                  </span>
                  <span className="badge badge-neutral">참고 {recentReferences.length}개</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isPartialGenerateAvailable ? (
                  <button
                    className="btn-secondary focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isGenerateSubmitting || status !== 'ready'}
                    onClick={handleGeneratePreviewOpen}
                    type="button"
                  >
                    {isGenerateSubmitting ? '정리 중...' : '부족한 채로 정리하기'}
                  </button>
                ) : null}
                <button
                  className="btn-teal focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !currentSession.canGenerate || isGenerateSubmitting || status !== 'ready'
                  }
                  onClick={handleGeneratePreviewOpen}
                  type="button"
                >
                  {isGenerateSubmitting ? '정리 중...' : '정리하기'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[var(--color-border-subtle)] pt-4">
              <button
                className={`tab ${isCanvasTabActive ? 'active' : ''}`}
                onClick={handleCanvasTabClick}
                type="button"
              >
                문서 캔버스
              </button>
              <button
                className={`tab ${isToolsTabActive ? 'active' : ''}`}
                onClick={handleToolsTabClick}
                type="button"
              >
                자료 · 체크리스트
              </button>
              <button
                className={`tab ${isReferencesTabActive ? 'active' : ''}`}
                onClick={handleReferencesTabClick}
                type="button"
              >
                이전 산출물
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isCanvasTabActive ? (
            <div className="flex flex-col gap-5">
              {isPreviewMode ? (
                <section className="workspace-card-muted border-2 border-[var(--color-accent)]">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="meta">Preview</p>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">
                        생성 전 확인
                      </h3>
                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                        지금까지 채운 항목으로 어떤 구조의 초안이 나갈지 먼저 확인합니다.
                      </p>
                    </div>
                    <span className={`badge ${readinessBadgeClassName}`}>
                      {readinessPercent}% 준비
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {currentSession.canvas.sections.map(renderPreviewSection)}
                  </div>

                  {hasEmptyPreviewSections ? (
                    <p className="mt-4 text-sm leading-6 text-[var(--color-warning)]">
                      비어 있는 섹션은 추정으로 작성됩니다. 근거가 부족한 부분이 있으면 더 보충하는
                      편이 안전합니다.
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                    <button
                      className="btn-secondary focus-ring"
                      onClick={handleGeneratePreviewCancel}
                      type="button"
                    >
                      더 보충합니다
                    </button>
                    <button
                      className="btn-teal focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isGenerateSubmitting}
                      onClick={handleGeneratePreviewConfirm}
                      type="button"
                    >
                      {isGenerateSubmitting ? '정리 중...' : '이대로 정리합니다'}
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  {!isPreviewMode && guidanceItems.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {guidanceItems.map(renderGuidanceCard)}
                    </div>
                  ) : null}

                  {generateError.length > 0 ? (
                    <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
                      {generateError}
                    </div>
                  ) : null}

                  {generateMessage.length > 0 ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-sunken)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {generateMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                    <article className="workspace-card flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="meta">Readiness</p>
                          <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
                            초안 생성 준비도
                          </h3>
                        </div>
                        <span className={`badge ${readinessBadgeClassName}`}>
                          {readinessMessage}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-[var(--color-border-subtle)]">
                          <div
                            className="h-2 rounded-full transition-[width] duration-300"
                            style={readinessBarStyle}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)]">
                          {readinessPercent}%
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                        {readinessHint}
                      </p>
                    </article>

                    <article className="workspace-card flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <p className="meta">Latest Draft</p>
                          <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
                            {latestDeliverable?.title ?? currentSession.title}
                          </h3>
                        </div>
                        {latestDeliverable ? (
                          <div className="flex items-center gap-2">
                            <span className="badge badge-neutral">{latestDeliverable.status}</span>
                            <span className="badge badge-accent">v{latestDeliverable.version}</span>
                          </div>
                        ) : (
                          <span className="badge badge-neutral">아직 없음</span>
                        )}
                      </div>

                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                        {latestDraftPreview}
                      </p>

                      {hasLatestDeliverable ? (
                        <div className="mt-auto flex flex-wrap gap-3">
                          <Link
                            className="btn-secondary focus-ring"
                            href={`/workspace/asset/${latestDeliverable?.id ?? lastGeneratedDeliverableId}`}
                          >
                            산출물 보기
                          </Link>
                        </div>
                      ) : null}
                    </article>
                  </div>

                  {isSessionLoading ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      세션을 새로 불러오는 중입니다...
                    </p>
                  ) : null}

                  <div className="grid gap-3">
                    {currentSession.canvas.sections.map(renderSectionCard)}
                  </div>
                </>
              )}
            </div>
          ) : null}
          {isToolsTabActive ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <form
                  className="workspace-card-muted flex flex-col gap-4"
                  onSubmit={handleSourceSubmit}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="meta">Source</p>
                      <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
                        근거자료 추가
                      </h3>
                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                        메모, 표, 수치, 붙여넣은 텍스트를 저장해 이후 초안 생성에 바로 씁니다.
                      </p>
                    </div>
                    <span className="badge badge-teal">
                      {currentSession.sources.length}개 저장됨
                    </span>
                  </div>

                  {sourceError.length > 0 ? (
                    <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
                      {sourceError}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                    <input
                      className="input-surface"
                      onChange={handleSourceLabelChange}
                      placeholder="자료 이름 (선택)"
                      value={sourceLabel}
                    />
                    <select
                      className="input-surface"
                      onChange={handleSourceTypeChange}
                      value={sourceType}
                    >
                      <option value="text">텍스트</option>
                      <option value="table">표</option>
                      <option value="data">데이터</option>
                    </select>
                  </div>

                  <textarea
                    className="input-surface min-h-28 resize-none"
                    onChange={handleSourceContentChange}
                    placeholder="예: 참여율 92%, 만족도 4.6/5, 사전·사후 테스트 점수 평균 17% 상승"
                    value={sourceContent}
                  />

                  <div className="flex justify-end">
                    <button
                      className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSourceSubmitting || sourceContent.trim().length === 0}
                      type="submit"
                    >
                      {isSourceSubmitting ? '자료 저장 중...' : '자료 저장'}
                    </button>
                  </div>
                </form>

                <article className="workspace-card flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="meta">Session Pulse</p>
                    <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
                      인터뷰 진행 상태
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-[var(--color-border-subtle)]">
                      <div
                        className="h-2 rounded-full transition-[width] duration-300"
                        style={readinessBarStyle}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                      {readinessPercent}%
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-[var(--color-text-secondary)]">
                    <p>체크리스트 {completedChecklistCount}개가 채워졌습니다.</p>
                    <p>자료 {currentSession.sources.length}개가 세션에 연결되어 있습니다.</p>
                    <p>참고 산출물은 최근 {recentReferences.length}건까지 자동으로 불러옵니다.</p>
                  </div>
                </article>
              </div>

              <div className="workspace-card-muted flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="meta">File Upload</p>
                    <h3 className="font-headline text-base font-bold text-[var(--color-text)]">
                      파일 업로드
                    </h3>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      .txt, .md, .docx 파일을 업로드하면 근거자료로 자동 변환됩니다. (최대 5MB)
                    </p>
                  </div>
                </div>

                {fileUploadError.length > 0 ? (
                  <div className="border-[var(--color-error)]/20 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
                    {fileUploadError}
                  </div>
                ) : null}

                {fileUploadMessage.length > 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-sunken)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {fileUploadMessage}
                  </div>
                ) : null}

                <input
                  accept=".txt,.md,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />

                <button
                  className="btn-secondary focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isFileUploading}
                  onClick={handleFileUploadClick}
                  type="button"
                >
                  {isFileUploading ? '업로드 중...' : '파일 선택'}
                </button>
              </div>

              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="meta">Checklist</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                      산파술 진행 상태
                    </h2>
                  </div>
                  <span className="badge badge-accent">
                    {completedChecklistCount}/{currentSession.template.checklist.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {currentSession.template.checklist.map(renderChecklistItem)}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="meta">Methodology</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                      추천 프레임워크
                    </h2>
                  </div>
                  <span className="badge badge-teal">
                    {currentSession.canvas.methodologySuggestions.length}개
                  </span>
                </div>

                <div className="grid gap-3">
                  {currentSession.canvas.methodologySuggestions.map(renderMethodologyCard)}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="meta">Collected Sources</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                      현재 세션 자료
                    </h2>
                  </div>
                  <span className="badge badge-neutral">{currentSession.sources.length}개</span>
                </div>

                {currentSession.sources.length === 0 ? (
                  renderWorkspaceEmptyState({
                    description:
                      '아직 저장된 자료가 없습니다. 대화만으로도 초안을 만들 수 있지만, 수치와 표를 붙여 넣으면 품질이 더 안정됩니다.',
                    eyebrow: 'Collected Sources',
                    mark: 'S.',
                    title: '세션 근거를 쌓아 두면 다음 정리가 빨라집니다',
                  })
                ) : (
                  <div className="grid gap-3">{currentSession.sources.map(renderSourceItem)}</div>
                )}
              </section>
            </div>
          ) : null}

          {isReferencesTabActive ? (
            <div className="flex flex-col gap-5">
              <section className="workspace-card-muted flex flex-col gap-2">
                <p className="meta">Reference Context</p>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">이전 산출물</h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  같은 유형의 최근 산출물 최대 3건을 자동으로 참고합니다. 가장 최근 문서는 자세히,
                  그 이전 문서는 구조 중심으로 요약해 컨텍스트에 넣습니다.
                </p>
              </section>

              {recentReferences.length === 0 ? (
                renderWorkspaceEmptyState({
                  description:
                    '같은 유형의 이전 산출물이 아직 없습니다. 이 세션이 첫 기준 문서가 됩니다.',
                  eyebrow: 'Reference Context',
                  mark: 'R.',
                  title: '이번 문서가 다음 보고서의 기준이 됩니다',
                })
              ) : (
                <div className="grid gap-3">{recentReferences.map(renderReferenceCard)}</div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <div
        aria-label="Resize interview panel"
        aria-orientation="vertical"
        className="group relative hidden w-2 shrink-0 cursor-col-resize bg-transparent xl:block"
        onMouseDown={handleSidebarResizeStart}
        role="separator"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--color-border)] transition-colors group-hover:bg-[var(--color-accent)]" />
      </div>

      <aside
        className="surface flex min-h-[760px] w-full flex-col overflow-hidden shadow-[var(--shadow-2)] xl:h-[calc(100vh-12rem)] xl:w-[var(--sidebar-width)] xl:shrink-0"
        style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
      >
        <div className="shrink-0 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="section-label">Interview</span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">HARP와 인터뷰</h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {currentSession.template.name} · 한 번에 한 항목씩 답하면 캔버스가 같이
                  채워집니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="badge badge-neutral">{currentSession.status}</span>
              {isChatBusy ? (
                <button className="btn-secondary px-3 py-2 text-xs" onClick={stop} type="button">
                  응답 중지
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0
            ? renderWorkspaceEmptyState({
                description:
                  '교육 목적과 대상부터 말해 주세요. 보유한 수치나 메모가 있으면 그대로 붙여 넣어도 되고, 모르는 항목은 예시를 먼저 보여 달라고 물으면 됩니다.',
                eyebrow: 'Interview Ready',
                mark: 'H.',
                title: '이 세션에서 무엇을 먼저 정리할까요?',
              })
            : null}

          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-4">
          {chatError || sessionError ? (
            <div className="border-[var(--color-error)]/20 mb-4 rounded-[var(--radius-md)] border bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
              {chatError?.message ?? sessionError?.message}
            </div>
          ) : null}

          <form className="flex flex-col gap-3" onSubmit={handleChatSubmit}>
            <label className="text-sm font-semibold text-[var(--color-text)]" htmlFor="chat-input">
              답변 또는 질문
            </label>

            <textarea
              className="input-surface min-h-28 resize-none"
              disabled={status !== 'ready'}
              id="chat-input"
              onChange={handleChatInputChange}
              placeholder="예: 이번 교육은 신임 리더 대상이었고, 만족도는 4.6점이었습니다."
              value={chatInput}
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[var(--color-text-tertiary)]">
                답변이 짧아도 됩니다. 모호하면 HARP가 한 번 더 구체화를 요청합니다.
              </p>
              <button
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status !== 'ready' || chatInput.trim().length === 0}
                type="submit"
              >
                {status === 'ready' ? '보내기' : '응답 대기 중'}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}

export { SessionCanvas };
export type { SessionCanvasProps };
