import { generateText } from 'ai';
import { and, desc, eq, ne, sql } from 'drizzle-orm';

import { getChatModel } from '@/lib/ai/provider';
import { getDb } from '@/lib/db';
import type { DeliverableSection, DeliverableStatus, TemplateType } from '@/lib/db/schema';
import { deliverablesTable, messagesTable, sessionsTable, sourcesTable } from '@/lib/db/schema';
import { getTemplateByType } from '@/lib/templates';

import {
  buildDeliverableMarkdown,
  buildRenderableDeliverableMarkdown,
  parseDeliverableMarkdown,
} from './parser';

import type { DeliverableDetail, DeliverableSummary } from './types';

function createDeliverableSummary({
  createdAt,
  id,
  sections,
  sessionId,
  status,
  templateType,
  title,
  updatedAt,
  version,
}: {
  createdAt: Date;
  id: string;
  sections: DeliverableSection[];
  sessionId: string | null;
  status: DeliverableStatus;
  templateType: TemplateType;
  title: string;
  updatedAt: Date;
  version: number;
}): DeliverableSummary {
  const previewSection = sections.find((section) => section.content.trim().length > 0);

  return {
    createdAt: createdAt.toISOString(),
    id,
    preview: previewSection?.content.slice(0, 240) ?? '미리보기 없음',
    sectionCount: sections.length,
    sessionId,
    status,
    templateType,
    title,
    updatedAt: updatedAt.toISOString(),
    version,
  };
}

function createDeliverableDetail({
  createdAt,
  id,
  sections,
  sessionId,
  status,
  templateType,
  title,
  updatedAt,
  version,
}: {
  createdAt: Date;
  id: string;
  sections: DeliverableSection[];
  sessionId: string | null;
  status: DeliverableStatus;
  templateType: TemplateType;
  title: string;
  updatedAt: Date;
  version: number;
}): DeliverableDetail {
  const template = getTemplateByType(templateType);

  return {
    ...createDeliverableSummary({
      createdAt,
      id,
      sections,
      sessionId,
      status,
      templateType,
      title,
      updatedAt,
      version,
    }),
    markdown: buildDeliverableMarkdown(title, sections),
    renderMarkdown: buildRenderableDeliverableMarkdown(title, sections),
    sections,
    templateName: template.name,
  };
}

function assertDeliverableStatusTransition(
  currentStatus: DeliverableStatus,
  nextStatus: DeliverableStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions: Record<DeliverableStatus, DeliverableStatus[]> = {
    draft: ['final'],
    final: ['promoted_asset'],
    promoted_asset: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error('허용되지 않은 산출물 상태 전이입니다.');
  }
}

function buildGenerationPromptContext({
  latestReferenceDeliverable,
  messages,
  sessionTitle,
  sources,
  templateType,
}: {
  latestReferenceDeliverable:
    | {
        sections: DeliverableSection[];
        title: string;
      }
    | undefined;
  messages: {
    content: string;
    role: 'assistant' | 'system' | 'user';
  }[];
  sessionTitle: string;
  sources: {
    content: string;
    label: string | null;
    type: string | null;
  }[];
  templateType: TemplateType;
}): string {
  const template = getTemplateByType(templateType);
  const conversationTranscript =
    messages.length > 0
      ? messages
          .map((message) => {
            const roleLabel =
              message.role === 'user' ? '담당자' : message.role === 'assistant' ? 'HARP' : '시스템';

            return `- ${roleLabel}: ${message.content.trim().replace(/\s+/g, ' ').slice(0, 1600)}`;
          })
          .join('\n')
      : '- 대화 기록 없음';
  const sourceContext =
    sources.length > 0
      ? sources
          .map((source, index) => {
            const label = source.label ?? `자료 ${index + 1}`;
            const sourceType = source.type ?? 'text';
            const content = source.content.trim().replace(/\s+/g, ' ').slice(0, 2000);

            return `- [${label} | ${sourceType}] ${content}`;
          })
          .join('\n')
      : '- 첨부된 근거자료 없음';
  const referenceContext = latestReferenceDeliverable
    ? buildDeliverableMarkdown(
        latestReferenceDeliverable.title,
        latestReferenceDeliverable.sections,
      )
    : '참고할 이전 동일 유형 산출물 없음';

  return [
    `[문서 제목] ${sessionTitle}`,
    '',
    '[현재 세션 대화 기록]',
    conversationTranscript,
    '',
    '[현재 세션 근거자료]',
    sourceContext,
    '',
    '[참고용 이전 동일 유형 산출물]',
    referenceContext,
    '',
    '[작성 요청]',
    `${template.name} 템플릿 기준으로 초안을 완성해 주세요.`,
  ].join('\n');
}

async function listDeliverablesByWorkspace(workspaceId: string): Promise<DeliverableSummary[]> {
  const database = getDb();
  const deliverableRows = await database
    .select({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    })
    .from(deliverablesTable)
    .where(eq(deliverablesTable.workspaceId, workspaceId))
    .orderBy(desc(deliverablesTable.updatedAt));

  return deliverableRows.map((deliverableRow) =>
    createDeliverableSummary({
      createdAt: deliverableRow.createdAt,
      id: deliverableRow.id,
      sections: deliverableRow.sections,
      sessionId: deliverableRow.sessionId,
      status: deliverableRow.status,
      templateType: deliverableRow.templateType,
      title: deliverableRow.title,
      updatedAt: deliverableRow.updatedAt,
      version: deliverableRow.version,
    }),
  );
}

async function listRecentReferenceDeliverablesByTemplate({
  excludeSessionId,
  limit,
  templateType,
  workspaceId,
}: {
  excludeSessionId?: string;
  limit: number;
  templateType: TemplateType;
  workspaceId: string;
}): Promise<DeliverableSummary[]> {
  const database = getDb();
  const filters = [
    eq(deliverablesTable.workspaceId, workspaceId),
    eq(deliverablesTable.templateType, templateType),
  ];

  if (excludeSessionId) {
    filters.push(ne(deliverablesTable.sessionId, excludeSessionId));
  }

  const deliverableRows = await database
    .select({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    })
    .from(deliverablesTable)
    .where(and(...filters))
    .orderBy(desc(deliverablesTable.updatedAt))
    .limit(limit);

  return deliverableRows.map((deliverableRow) =>
    createDeliverableSummary({
      createdAt: deliverableRow.createdAt,
      id: deliverableRow.id,
      sections: deliverableRow.sections,
      sessionId: deliverableRow.sessionId,
      status: deliverableRow.status,
      templateType: deliverableRow.templateType,
      title: deliverableRow.title,
      updatedAt: deliverableRow.updatedAt,
      version: deliverableRow.version,
    }),
  );
}

async function getLatestDeliverableSummaryForSession(
  sessionId: string,
  workspaceId: string,
): Promise<DeliverableSummary | null> {
  const database = getDb();
  const deliverableRows = await database
    .select({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    })
    .from(deliverablesTable)
    .where(
      and(
        eq(deliverablesTable.sessionId, sessionId),
        eq(deliverablesTable.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(deliverablesTable.updatedAt))
    .limit(1);

  const deliverableRow = deliverableRows[0];

  if (!deliverableRow) {
    return null;
  }

  return createDeliverableSummary({
    createdAt: deliverableRow.createdAt,
    id: deliverableRow.id,
    sections: deliverableRow.sections,
    sessionId: deliverableRow.sessionId,
    status: deliverableRow.status,
    templateType: deliverableRow.templateType,
    title: deliverableRow.title,
    updatedAt: deliverableRow.updatedAt,
    version: deliverableRow.version,
  });
}

async function getDeliverableDetailForWorkspace(
  deliverableId: string,
  workspaceId: string,
): Promise<DeliverableDetail | null> {
  const database = getDb();
  const deliverableRows = await database
    .select({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    })
    .from(deliverablesTable)
    .where(
      and(eq(deliverablesTable.id, deliverableId), eq(deliverablesTable.workspaceId, workspaceId)),
    )
    .limit(1);

  const deliverableRow = deliverableRows[0];

  if (!deliverableRow) {
    return null;
  }

  return createDeliverableDetail({
    createdAt: deliverableRow.createdAt,
    id: deliverableRow.id,
    sections: deliverableRow.sections,
    sessionId: deliverableRow.sessionId,
    status: deliverableRow.status,
    templateType: deliverableRow.templateType,
    title: deliverableRow.title,
    updatedAt: deliverableRow.updatedAt,
    version: deliverableRow.version,
  });
}

async function generateDeliverableForSession({
  sessionId,
  workspaceId,
}: {
  sessionId: string;
  workspaceId: string;
}): Promise<DeliverableDetail> {
  const database = getDb();
  const sessionRows = await database
    .select({
      id: sessionsTable.id,
      status: sessionsTable.status,
      templateType: sessionsTable.templateType,
      title: sessionsTable.title,
    })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.workspaceId, workspaceId)))
    .limit(1);
  const sessionRow = sessionRows[0];

  if (!sessionRow) {
    throw new Error('세션을 찾을 수 없습니다.');
  }

  const [messageRows, sourceRows, latestReferenceRows, latestSessionDeliverableRows] =
    await Promise.all([
      database
        .select({
          content: messagesTable.content,
          role: messagesTable.role,
        })
        .from(messagesTable)
        .where(eq(messagesTable.sessionId, sessionId))
        .orderBy(messagesTable.createdAt),
      database
        .select({
          content: sourcesTable.content,
          label: sourcesTable.label,
          type: sourcesTable.type,
        })
        .from(sourcesTable)
        .where(eq(sourcesTable.sessionId, sessionId))
        .orderBy(desc(sourcesTable.createdAt)),
      database
        .select({
          sections: deliverablesTable.sections,
          title: deliverablesTable.title,
        })
        .from(deliverablesTable)
        .where(
          and(
            eq(deliverablesTable.workspaceId, workspaceId),
            eq(deliverablesTable.templateType, sessionRow.templateType),
            ne(deliverablesTable.sessionId, sessionId),
          ),
        )
        .orderBy(desc(deliverablesTable.updatedAt))
        .limit(1),
      database
        .select({
          createdAt: deliverablesTable.createdAt,
          id: deliverablesTable.id,
          sections: deliverablesTable.sections,
          sessionId: deliverablesTable.sessionId,
          status: deliverablesTable.status,
          templateType: deliverablesTable.templateType,
          title: deliverablesTable.title,
          updatedAt: deliverablesTable.updatedAt,
          version: deliverablesTable.version,
        })
        .from(deliverablesTable)
        .where(
          and(
            eq(deliverablesTable.workspaceId, workspaceId),
            eq(deliverablesTable.sessionId, sessionId),
          ),
        )
        .orderBy(desc(deliverablesTable.updatedAt))
        .limit(1),
    ]);

  const template = getTemplateByType(sessionRow.templateType);
  const generationResult = await generateText({
    model: getChatModel(),
    prompt: buildGenerationPromptContext({
      latestReferenceDeliverable: latestReferenceRows[0],
      messages: messageRows,
      sessionTitle: sessionRow.title ?? template.name,
      sources: sourceRows,
      templateType: sessionRow.templateType,
    }),
    system: template.systemPrompt.generate,
    temperature: 0.2,
  });
  const parsedDeliverable = parseDeliverableMarkdown({
    rawMarkdown: generationResult.text,
    templateType: sessionRow.templateType,
  });

  if (!parsedDeliverable) {
    throw new Error('AI 산출물 형식을 해석하지 못했습니다.');
  }

  const latestSessionDeliverable = latestSessionDeliverableRows[0];
  const nextVersion = (latestSessionDeliverable?.version ?? 0) + 1;
  const nextTitle = sessionRow.title ?? template.name;

  return database.transaction(async (transaction) => {
    let persistedDeliverableId = latestSessionDeliverable?.id ?? null;

    if (latestSessionDeliverable?.status === 'draft') {
      await transaction
        .update(deliverablesTable)
        .set({
          sections: parsedDeliverable.sections,
          title: nextTitle,
          updatedAt: sql`now()`,
          version: nextVersion,
        })
        .where(eq(deliverablesTable.id, latestSessionDeliverable.id));
      persistedDeliverableId = latestSessionDeliverable.id;
    } else {
      const createdDeliverables = await transaction
        .insert(deliverablesTable)
        .values({
          sections: parsedDeliverable.sections,
          sessionId,
          status: 'draft',
          templateType: sessionRow.templateType,
          title: nextTitle,
          version: nextVersion,
          workspaceId,
        })
        .returning({ id: deliverablesTable.id });

      persistedDeliverableId = createdDeliverables[0]?.id ?? null;
    }

    if (!persistedDeliverableId) {
      throw new Error('산출물 저장에 실패했습니다.');
    }

    await transaction
      .update(sessionsTable)
      .set({
        status: 'completed',
        updatedAt: sql`now()`,
      })
      .where(eq(sessionsTable.id, sessionId));

    const persistedDeliverableRows = await transaction
      .select({
        createdAt: deliverablesTable.createdAt,
        id: deliverablesTable.id,
        sections: deliverablesTable.sections,
        sessionId: deliverablesTable.sessionId,
        status: deliverablesTable.status,
        templateType: deliverablesTable.templateType,
        title: deliverablesTable.title,
        updatedAt: deliverablesTable.updatedAt,
        version: deliverablesTable.version,
      })
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, persistedDeliverableId))
      .limit(1);

    const persistedDeliverable = persistedDeliverableRows[0];

    if (!persistedDeliverable) {
      throw new Error('저장된 산출물을 다시 찾을 수 없습니다.');
    }

    return createDeliverableDetail({
      createdAt: persistedDeliverable.createdAt,
      id: persistedDeliverable.id,
      sections: persistedDeliverable.sections,
      sessionId: persistedDeliverable.sessionId,
      status: persistedDeliverable.status,
      templateType: persistedDeliverable.templateType,
      title: persistedDeliverable.title,
      updatedAt: persistedDeliverable.updatedAt,
      version: persistedDeliverable.version,
    });
  });
}

async function updateDeliverableForWorkspace({
  deliverableId,
  markdown,
  status,
  title,
  workspaceId,
}: {
  deliverableId: string;
  markdown?: string;
  status?: DeliverableStatus;
  title?: string;
  workspaceId: string;
}): Promise<DeliverableDetail> {
  const database = getDb();
  const deliverableRows = await database
    .select({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    })
    .from(deliverablesTable)
    .where(
      and(eq(deliverablesTable.id, deliverableId), eq(deliverablesTable.workspaceId, workspaceId)),
    )
    .limit(1);
  const deliverableRow = deliverableRows[0];

  if (!deliverableRow) {
    throw new Error('산출물을 찾을 수 없습니다.');
  }

  const nextStatus = status ?? deliverableRow.status;

  assertDeliverableStatusTransition(deliverableRow.status, nextStatus);

  const parsedDeliverable =
    markdown !== undefined
      ? parseDeliverableMarkdown({
          rawMarkdown: markdown,
          templateType: deliverableRow.templateType,
        })
      : null;

  if (markdown !== undefined && !parsedDeliverable) {
    throw new Error('산출물 Markdown 형식이 올바르지 않습니다.');
  }

  const shouldBumpVersion = title !== undefined || markdown !== undefined;
  const nextVersion = shouldBumpVersion ? deliverableRow.version + 1 : deliverableRow.version;

  const updatedRows = await database
    .update(deliverablesTable)
    .set({
      sections: parsedDeliverable?.sections ?? deliverableRow.sections,
      status: nextStatus,
      title: title ?? deliverableRow.title,
      updatedAt: sql`now()`,
      version: nextVersion,
    })
    .where(eq(deliverablesTable.id, deliverableId))
    .returning({
      createdAt: deliverablesTable.createdAt,
      id: deliverablesTable.id,
      sections: deliverablesTable.sections,
      sessionId: deliverablesTable.sessionId,
      status: deliverablesTable.status,
      templateType: deliverablesTable.templateType,
      title: deliverablesTable.title,
      updatedAt: deliverablesTable.updatedAt,
      version: deliverablesTable.version,
    });
  const updatedDeliverable = updatedRows[0];

  if (!updatedDeliverable) {
    throw new Error('산출물 수정에 실패했습니다.');
  }

  return createDeliverableDetail({
    createdAt: updatedDeliverable.createdAt,
    id: updatedDeliverable.id,
    sections: updatedDeliverable.sections,
    sessionId: updatedDeliverable.sessionId,
    status: updatedDeliverable.status,
    templateType: updatedDeliverable.templateType,
    title: updatedDeliverable.title,
    updatedAt: updatedDeliverable.updatedAt,
    version: updatedDeliverable.version,
  });
}

export {
  generateDeliverableForSession,
  getDeliverableDetailForWorkspace,
  getLatestDeliverableSummaryForSession,
  listDeliverablesByWorkspace,
  listRecentReferenceDeliverablesByTemplate,
  updateDeliverableForWorkspace,
};
