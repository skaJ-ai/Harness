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

function buildRenderableDeliverableMarkdown(title: string, sections: DeliverableSection[]): string {
  const sectionMarkdown = sections
    .map((section) =>
      [`## ${section.name}`, section.content.trim()]
        .filter((value) => value.length > 0)
        .join('\n\n'),
    )
    .join('\n\n');

  return `# ${title}\n\n${sectionMarkdown}`.trim();
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

export { buildDeliverableMarkdown, buildRenderableDeliverableMarkdown, parseDeliverableMarkdown };
