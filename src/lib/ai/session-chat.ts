import type { SessionChecklist, TemplateType } from '@/lib/db/schema';
import type {
  SessionCanvasState,
  SessionCanvasUpdate,
  SessionMethodologySuggestion,
} from '@/lib/sessions/types';
import { getTemplateByType } from '@/lib/templates';

import type { StreamTextTransform, UIMessage } from 'ai';

interface BuildInterviewContextOptions {
  currentChecklist: SessionChecklist;
  recentDeliverables: {
    summary: string;
    title: string;
  }[];
  sources: {
    content: string;
    label: string | null;
    type: string | null;
  }[];
  templateType: TemplateType;
}

interface ParsedAssistantMetadata {
  canvas: SessionCanvasUpdate | null;
  checklist: SessionChecklist | null;
  visibleText: string;
}

const CHECKLIST_METADATA_MARKER = '<!-- checklist:';

function buildInterviewContext({
  currentChecklist,
  recentDeliverables,
  sources,
  templateType,
}: BuildInterviewContextOptions): string {
  const template = getTemplateByType(templateType);
  const checklistState = JSON.stringify(currentChecklist);
  const sourceContext =
    sources.length > 0
      ? sources
          .map((source, index) => {
            const normalizedContent = source.content.trim().replace(/\s+/g, ' ').slice(0, 1200);
            const label = source.label ?? `자료 ${index + 1}`;
            const sourceType = source.type ?? 'text';

            return `- [${label} | ${sourceType}] ${normalizedContent}`;
          })
          .join('\n')
      : '- 현재 첨부된 근거자료 없음';
  const deliverableContext =
    recentDeliverables.length > 0
      ? recentDeliverables
          .map(
            (deliverable, index) =>
              `- 참고 ${index + 1}: ${deliverable.title}\n  요약: ${deliverable.summary}`,
          )
          .join('\n')
      : '- 같은 유형의 이전 산출물 없음';

  return [
    template.systemPrompt.interview,
    '',
    '[현재 체크리스트 상태]',
    checklistState,
    '',
    '[현재 세션 근거자료]',
    sourceContext,
    '',
    '[같은 유형의 이전 산출물 요약]',
    deliverableContext,
  ].join('\n');
}

function createMetadataCommentTransform(): StreamTextTransform<Record<string, never>> {
  return () => {
    let buffer = '';
    let currentTextId = '';
    let isMetadataStarted = false;

    return new TransformStream({
      flush(controller) {
        if (!isMetadataStarted && buffer.length > 0 && currentTextId.length > 0) {
          controller.enqueue({
            id: currentTextId,
            text: buffer,
            type: 'text-delta',
          });
        }
      },
      transform(chunk, controller) {
        if (chunk.type !== 'text-delta') {
          controller.enqueue(chunk);
          return;
        }

        currentTextId = chunk.id;

        if (isMetadataStarted) {
          return;
        }

        buffer += chunk.text;

        const markerIndex = buffer.indexOf(CHECKLIST_METADATA_MARKER);

        if (markerIndex >= 0) {
          const visibleText = buffer.slice(0, markerIndex);

          if (visibleText.length > 0) {
            controller.enqueue({
              ...chunk,
              text: visibleText,
            });
          }

          buffer = '';
          isMetadataStarted = true;
          return;
        }

        const safeBoundary = Math.max(0, buffer.length - CHECKLIST_METADATA_MARKER.length + 1);

        if (safeBoundary === 0) {
          return;
        }

        controller.enqueue({
          ...chunk,
          text: buffer.slice(0, safeBoundary),
        });
        buffer = buffer.slice(safeBoundary);
      },
    });
  };
}

function extractTextFromUiMessage(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: 'text' }> =>
        part.type === 'text',
    )
    .map((part) => part.text)
    .join('')
    .trim();
}

function parseAssistantMetadata(rawAssistantText: string): ParsedAssistantMetadata {
  const checklistMatch = rawAssistantText.match(/<!--\s*checklist:(.*?)-->/s);
  const canvasMatch = rawAssistantText.match(/<!--\s*canvas:(.*?)-->/s);
  const visibleText = rawAssistantText
    .replace(/<!--\s*checklist:(.*?)-->/gs, '')
    .replace(/<!--\s*canvas:(.*?)-->/gs, '')
    .trim();

  return {
    canvas: parseCanvasMetadata(canvasMatch?.[1]),
    checklist: parseChecklistMetadata(checklistMatch?.[1]),
    visibleText,
  };
}

function parseCanvasMetadata(rawCanvas: string | undefined): SessionCanvasUpdate | null {
  if (!rawCanvas) {
    return null;
  }

  try {
    const parsedCanvas = JSON.parse(rawCanvas) as SessionCanvasUpdate;

    if (!Array.isArray(parsedCanvas.sections)) {
      return null;
    }

    return {
      methodologySuggestionIds: Array.isArray(parsedCanvas.methodologySuggestionIds)
        ? parsedCanvas.methodologySuggestionIds.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      sections: parsedCanvas.sections
        .filter(
          (section): section is { content: string; name: string } =>
            typeof section === 'object' &&
            section !== null &&
            typeof section.name === 'string' &&
            typeof section.content === 'string',
        )
        .map((section) => ({
          content: section.content.trim(),
          name: section.name,
        })),
      title: typeof parsedCanvas.title === 'string' ? parsedCanvas.title : undefined,
    };
  } catch {
    return null;
  }
}

function parseChecklistMetadata(rawChecklist: string | undefined): SessionChecklist | null {
  if (!rawChecklist) {
    return null;
  }

  try {
    const parsedChecklist = JSON.parse(rawChecklist) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsedChecklist).map(([key, value]) => [key, value === true]),
    );
  } catch {
    return null;
  }
}

function mergeCanvasState(
  templateType: TemplateType,
  rawCanvas: SessionCanvasUpdate | null,
): SessionCanvasState {
  const template = getTemplateByType(templateType);
  const sectionsByName = new Map(
    rawCanvas?.sections.map((section) => [section.name, section.content]) ?? [],
  );
  const fallbackSections = rawCanvas?.sections ?? [];

  return {
    methodologySuggestions: getMethodologySuggestions(
      templateType,
      rawCanvas?.methodologySuggestionIds ?? [],
    ),
    sections: template.sections.map((section, index) => {
      const matchedContent =
        sectionsByName.get(section.name) ?? fallbackSections[index]?.content ?? '';
      const trimmedContent = matchedContent.trim();

      return {
        content: trimmedContent,
        description: section.description,
        name: section.name,
        required: section.required,
        status: trimmedContent.length > 0 ? 'complete' : 'empty',
      };
    }),
    title: rawCanvas?.title?.trim() || template.name,
  };
}

function getMethodologySuggestions(
  templateType: TemplateType,
  methodologyIds: string[],
): SessionMethodologySuggestion[] {
  const template = getTemplateByType(templateType);
  const allMethodologies = Object.values(template.methodologyMap).flat();
  const methodologiesById = new Map(
    allMethodologies.map((methodology) => [methodology.id, methodology]),
  );
  const selectedMethodologies = methodologyIds
    .map((methodologyId) => methodologiesById.get(methodologyId))
    .filter((methodology): methodology is SessionMethodologySuggestion => Boolean(methodology));

  if (selectedMethodologies.length > 0) {
    return selectedMethodologies;
  }

  return allMethodologies;
}

export {
  buildInterviewContext,
  createMetadataCommentTransform,
  extractTextFromUiMessage,
  mergeCanvasState,
  parseAssistantMetadata,
};
