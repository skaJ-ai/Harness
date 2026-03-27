import type { SessionChecklist, SessionStatus, SourceType, TemplateType } from '@/lib/db/schema';
import type { DeliverableSummary } from '@/lib/deliverables/types';
import type {
  MethodologyCard,
  TemplateChecklistItem,
  TemplateMethodologyMap,
  TemplateSectionDefinition,
} from '@/lib/templates';

type SessionCanvasSectionStatus = 'complete' | 'empty';

interface SessionMethodologySuggestion extends MethodologyCard {}

interface SessionCanvasSection {
  content: string;
  description: string;
  name: string;
  required: boolean;
  status: SessionCanvasSectionStatus;
}

interface SessionCanvasUpdate {
  methodologySuggestionIds?: string[];
  sections: {
    content: string;
    name: string;
  }[];
  title?: string;
}

interface SessionCanvasState {
  methodologySuggestions: SessionMethodologySuggestion[];
  sections: SessionCanvasSection[];
  title: string;
}

interface SessionMessageMetadata {
  canvas?: SessionCanvasUpdate;
  checklist?: SessionChecklist;
  uiMessageId?: string;
}

interface SessionChatMessage {
  content: string;
  createdAt: string;
  id: string;
  role: 'assistant' | 'system' | 'user';
}

interface SessionSourceSummary {
  content: string;
  createdAt: string;
  id: string;
  label: string | null;
  type: SourceType | null;
}

interface SessionTemplateSummary {
  checklist: TemplateChecklistItem[];
  description: string;
  estimatedMinutes: number;
  methodologyMap: TemplateMethodologyMap;
  name: string;
  sections: TemplateSectionDefinition[];
  type: TemplateType;
}

interface SessionSummary {
  checklist: SessionChecklist;
  createdAt: string;
  id: string;
  messageCount: number;
  sourceCount: number;
  status: SessionStatus;
  template: SessionTemplateSummary;
  title: string;
  updatedAt: string;
}

interface SessionDetail extends SessionSummary {
  canGenerate: boolean;
  canvas: SessionCanvasState;
  latestDeliverable: DeliverableSummary | null;
  messages: SessionChatMessage[];
  recentReferences: DeliverableSummary[];
  sources: SessionSourceSummary[];
}

interface CreateSessionRequestBody {
  templateType: TemplateType;
}

interface CreateSourceRequestBody {
  content: string;
  label?: string;
  type?: SourceType;
}

export type {
  CreateSessionRequestBody,
  CreateSourceRequestBody,
  SessionCanvasState,
  SessionCanvasUpdate,
  SessionChatMessage,
  SessionDetail,
  SessionMessageMetadata,
  SessionMethodologySuggestion,
  SessionSourceSummary,
  SessionSummary,
  SessionTemplateSummary,
};
