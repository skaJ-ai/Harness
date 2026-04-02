import { AlignmentType, Document, Footer, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

import type { DeliverableSection } from '@/lib/db/schema';

const AI_DISCLOSURE_TEXT = '이 문서는 HARP AI의 도움을 받아 작성되었습니다.';
const BOLD_MARKER_REGEX = /\*\*(.+?)\*\*/g;
const BULLET_LINE_REGEX = /^[-*]\s+/;

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = BOLD_MARKER_REGEX.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }

    runs.push(new TextRun({ bold: true, text: match[1] ?? '' }));
    lastIndex = match.index + match[0].length;
    match = BOLD_MARKER_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

function createParagraphsFromContent(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    if (BULLET_LINE_REGEX.test(trimmedLine)) {
      const bulletText = trimmedLine.replace(BULLET_LINE_REGEX, '');

      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(bulletText),
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(trimmedLine),
          spacing: { after: 120 },
        }),
      );
    }
  }

  return paragraphs;
}

async function generateDocxBuffer({
  sections,
  title,
}: {
  sections: DeliverableSection[];
  title: string;
}): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: title })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
    }),
  );

  for (const section of sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.name })],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 120, before: 240 },
      }),
    );

    if (section.content.trim().length > 0) {
      children.push(...createParagraphsFromContent(section.content));
    }
  }

  const document = new Document({
    sections: [
      {
        children,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    color: '888888',
                    italics: true,
                    size: 18,
                    text: AI_DISCLOSURE_TEXT,
                  }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);

  return Buffer.from(buffer);
}

export { generateDocxBuffer };
