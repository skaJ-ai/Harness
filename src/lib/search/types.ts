import type { DeliverableStatus, SourceType, TemplateType } from '@/lib/db/schema';

type WorkspaceSearchResultKind = 'deliverable' | 'source';

interface WorkspaceSearchResult {
  href: string;
  id: string;
  kind: WorkspaceSearchResultKind;
  rank: number;
  snippet: string;
  sourceType?: SourceType | null;
  status?: DeliverableStatus;
  templateType?: TemplateType;
  title: string;
  updatedAt: string;
}

export type { WorkspaceSearchResult, WorkspaceSearchResultKind };
