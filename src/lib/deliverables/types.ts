import type { DeliverableSection, DeliverableStatus, TemplateType } from '@/lib/db/schema';

interface DeliverableSummary {
  createdAt: string;
  id: string;
  preview: string;
  sectionCount: number;
  sessionId: string | null;
  status: DeliverableStatus;
  templateType: TemplateType;
  title: string;
  updatedAt: string;
  version: number;
}

interface DeliverableDetail extends DeliverableSummary {
  markdown: string;
  renderMarkdown: string;
  sections: DeliverableSection[];
  templateName: string;
}

interface ParsedDeliverableMarkdown {
  sections: DeliverableSection[];
}

export type { DeliverableDetail, DeliverableSummary, ParsedDeliverableMarkdown };
