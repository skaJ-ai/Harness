import { and, desc, eq, sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { deliverablesTable, sessionsTable, sourcesTable } from '@/lib/db/schema';

import type { WorkspaceSearchResult } from './types';

function buildSearchSnippet(content: string, query: string): string {
  const normalizedContent = content.trim().replace(/\s+/g, ' ');
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedContent.length === 0) {
    return '요약 없음';
  }

  const matchIndex = normalizedContent.toLowerCase().indexOf(normalizedQuery);

  if (matchIndex < 0) {
    return normalizedContent.slice(0, 180);
  }

  const snippetStart = Math.max(0, matchIndex - 60);
  const snippetEnd = Math.min(normalizedContent.length, matchIndex + normalizedQuery.length + 120);
  const prefix = snippetStart > 0 ? '... ' : '';
  const suffix = snippetEnd < normalizedContent.length ? ' ...' : '';

  return `${prefix}${normalizedContent.slice(snippetStart, snippetEnd)}${suffix}`;
}

function compareSearchResults(left: WorkspaceSearchResult, right: WorkspaceSearchResult): number {
  if (right.rank !== left.rank) {
    return right.rank - left.rank;
  }

  return right.updatedAt.localeCompare(left.updatedAt);
}

async function searchWorkspaceContent({
  query,
  workspaceId,
}: {
  query: string;
  workspaceId: string;
}): Promise<WorkspaceSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const database = getDb();
  const deliverableVector = sql`to_tsvector('simple', ${deliverablesTable.title} || ' ' || ${deliverablesTable.sections}::text)`;
  const sourceVector = sql`to_tsvector('simple', ${sourcesTable.content})`;
  const tsQuery = sql`plainto_tsquery('simple', ${normalizedQuery})`;
  const deliverableRank = sql<number>`ts_rank_cd(${deliverableVector}, ${tsQuery})`;
  const sourceRank = sql<number>`ts_rank_cd(${sourceVector}, ${tsQuery})`;
  const [deliverableRows, sourceRows] = await Promise.all([
    database
      .select({
        id: deliverablesTable.id,
        rank: deliverableRank,
        sections: deliverablesTable.sections,
        status: deliverablesTable.status,
        templateType: deliverablesTable.templateType,
        title: deliverablesTable.title,
        updatedAt: deliverablesTable.updatedAt,
      })
      .from(deliverablesTable)
      .where(
        and(
          eq(deliverablesTable.workspaceId, workspaceId),
          sql`${deliverableVector} @@ ${tsQuery}`,
        ),
      )
      .orderBy(sql`${deliverableRank} desc`, desc(deliverablesTable.updatedAt))
      .limit(8),
    database
      .select({
        content: sourcesTable.content,
        id: sourcesTable.id,
        label: sourcesTable.label,
        rank: sourceRank,
        sessionId: sourcesTable.sessionId,
        sourceType: sourcesTable.type,
        updatedAt: sourcesTable.createdAt,
      })
      .from(sourcesTable)
      .innerJoin(sessionsTable, eq(sourcesTable.sessionId, sessionsTable.id))
      .where(and(eq(sessionsTable.workspaceId, workspaceId), sql`${sourceVector} @@ ${tsQuery}`))
      .orderBy(sql`${sourceRank} desc`, desc(sourcesTable.createdAt))
      .limit(8),
  ]);

  const deliverableResults: WorkspaceSearchResult[] = deliverableRows.map((deliverableRow) => {
    const joinedSectionContent = deliverableRow.sections
      .map((section) => `${section.name} ${section.content}`)
      .join(' ');

    return {
      href: `/workspace/asset/${deliverableRow.id}`,
      id: deliverableRow.id,
      kind: 'deliverable',
      rank: Number(deliverableRow.rank),
      snippet: buildSearchSnippet(joinedSectionContent, normalizedQuery),
      status: deliverableRow.status,
      templateType: deliverableRow.templateType,
      title: deliverableRow.title,
      updatedAt: deliverableRow.updatedAt.toISOString(),
    };
  });
  const sourceResults: WorkspaceSearchResult[] = sourceRows.map((sourceRow, index) => ({
    href: `/workspace/session/${sourceRow.sessionId}`,
    id: sourceRow.id,
    kind: 'source',
    rank: Number(sourceRow.rank) - index * 0.0001,
    snippet: buildSearchSnippet(sourceRow.content, normalizedQuery),
    sourceType: sourceRow.sourceType,
    title: sourceRow.label ?? '세션 근거자료',
    updatedAt: sourceRow.updatedAt.toISOString(),
  }));

  return [...deliverableResults, ...sourceResults].sort(compareSearchResults);
}

export { searchWorkspaceContent };
