import type { DeliverableSection, TemplateType } from '@/lib/db/schema';
import { getTemplateByType } from '@/lib/templates';

import type { ParsedDeliverableMarkdown } from './types';

const DELIVERABLE_CONFIDENCE_VALUES = ['high', 'low', 'medium'] as const;

function buildDeliverableMarkdown(title: string, sections: DeliverableSection[]): string {
  const sectionMarkdown = sections
    .map((section) =>
      [
        `## ${section.name}`,
        `<!-- section-meta:${JSON.stringify({
          confidence: section.confidence,
          cited: section.cited,
        })} -->`,
        section.content.trim(),
      ]
        .filter((value) => value.length > 0)
        .join('\n'),
    )
    .join('\n\n');

  return `# ${title}\n\n${sectionMarkdown}`.trim();
}

const AI_DISCLOSURE_FOOTER = '\n\n---\n\n> 이 문서는 HARP AI의 도움을 받아 작성되었습니다.';

function buildRenderableDeliverableMarkdown(title: string, sections: DeliverableSection[]): string {
  const sectionMarkdown = sections
    .map((section) =>
      [`## ${section.name}`, section.content.trim()]
        .filter((value) => value.length > 0)
        .join('\n\n'),
    )
    .join('\n\n');

  return `# ${title}\n\n${sectionMarkdown}`.trim() + AI_DISCLOSURE_FOOTER;
}

function parseDeliverableMarkdown({
  rawMarkdown,
  templateType,
}: {
  rawMarkdown: string;
  templateType: TemplateType;
}): ParsedDeliverableMarkdown | null {
  const normalizedMarkdown = rawMarkdown.replace(/\r\n/g, '\n').trim();
  const sectionMatches = Array.from(
    normalizedMarkdown.matchAll(
      /^##\s+(.+?)\n<!--\s*section-meta:(.*?)-->\n?([\s\S]*?)(?=^##\s+|\s*$)/gm,
    ),
  );

  if (sectionMatches.length === 0) {
    return null;
  }

  const template = getTemplateByType(templateType);
  const sectionsByName = new Map<string, DeliverableSection>();

  for (const sectionMatch of sectionMatches) {
    const rawName = sectionMatch[1]?.trim();
    const rawMetadata = sectionMatch[2];
    const rawContent = sectionMatch[3]?.trim() ?? '';

    if (!rawName || !rawMetadata) {
      continue;
    }

    const parsedMetadata = parseSectionMetadata(rawMetadata);

    if (!parsedMetadata) {
      continue;
    }

    sectionsByName.set(rawName, {
      cited: parsedMetadata.cited,
      confidence: parsedMetadata.confidence,
      content: rawContent,
      name: rawName,
    });
  }

  if (sectionsByName.size === 0) {
    return null;
  }

  return {
    sections: template.sections.map((section) => {
      const matchedSection = sectionsByName.get(section.name);

      return (
        matchedSection ?? {
          cited: false,
          confidence: 'low',
          content: '',
          name: section.name,
        }
      );
    }),
  };
}

function parseSectionMetadata(
  rawMetadata: string,
): { cited: boolean; confidence: DeliverableSection['confidence'] } | null {
  try {
    const parsedMetadata = JSON.parse(rawMetadata) as {
      cited?: unknown;
      confidence?: unknown;
    };

    if (
      typeof parsedMetadata.cited !== 'boolean' ||
      typeof parsedMetadata.confidence !== 'string' ||
      !DELIVERABLE_CONFIDENCE_VALUES.includes(
        parsedMetadata.confidence as (typeof DELIVERABLE_CONFIDENCE_VALUES)[number],
      )
    ) {
      return null;
    }

    return {
      cited: parsedMetadata.cited,
      confidence: parsedMetadata.confidence as DeliverableSection['confidence'],
    };
  } catch {
    return null;
  }
}

function reconstructDeliverableMarkdown(
  editedRenderMarkdown: string,
  originalSections: DeliverableSection[],
): string {
  const normalizedMarkdown = editedRenderMarkdown.replace(/\r\n/g, '\n').trim();
  const sectionRegex = /^##\s+(.+?)$/gm;
  const sectionHeaders: { index: number; name: string }[] = [];
  let headerMatch: RegExpExecArray | null = sectionRegex.exec(normalizedMarkdown);

  while (headerMatch !== null) {
    sectionHeaders.push({
      index: headerMatch.index,
      name: headerMatch[1]?.trim() ?? '',
    });
    headerMatch = sectionRegex.exec(normalizedMarkdown);
  }

  const metadataByName = new Map<
    string,
    { cited: boolean; confidence: DeliverableSection['confidence'] }
  >();

  for (const section of originalSections) {
    metadataByName.set(section.name, {
      cited: section.cited,
      confidence: section.confidence,
    });
  }

  const parts: string[] = [];
  const titleLine = normalizedMarkdown
    .slice(0, sectionHeaders[0]?.index ?? normalizedMarkdown.length)
    .trim();

  if (titleLine.length > 0) {
    parts.push(titleLine);
  }

  for (let i = 0; i < sectionHeaders.length; i++) {
    const current = sectionHeaders[i];

    if (!current) {
      continue;
    }

    const nextIndex = sectionHeaders[i + 1]?.index ?? normalizedMarkdown.length;
    const sectionBlock = normalizedMarkdown.slice(current.index, nextIndex).trim();
    const headerEnd = sectionBlock.indexOf('\n');
    const headerLine = headerEnd === -1 ? sectionBlock : sectionBlock.slice(0, headerEnd);
    const content = headerEnd === -1 ? '' : sectionBlock.slice(headerEnd + 1).trim();
    const metadata = metadataByName.get(current.name) ?? {
      cited: false,
      confidence: 'low' as const,
    };
    const metaComment = `<!-- section-meta:${JSON.stringify({ confidence: metadata.confidence, cited: metadata.cited })} -->`;

    parts.push([headerLine, metaComment, content].filter((value) => value.length > 0).join('\n'));
  }

  return parts.join('\n\n');
}

export {
  buildDeliverableMarkdown,
  buildRenderableDeliverableMarkdown,
  parseDeliverableMarkdown,
  reconstructDeliverableMarkdown,
};
