import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import { generateDocxBuffer } from '@/lib/deliverables/docx-export';
import { getDeliverableDetailForWorkspace } from '@/lib/deliverables/service';

const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|]/g;

async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    if (format !== 'docx') {
      return new Response(JSON.stringify({ message: '지원하지 않는 형식입니다.', status: 400 }), {
        headers: { 'content-type': 'application/json' },
        status: 400,
      });
    }

    const deliverable = await getDeliverableDetailForWorkspace(id, currentUser.workspaceId);

    if (!deliverable) {
      return new Response(JSON.stringify({ message: '산출물을 찾을 수 없습니다.', status: 404 }), {
        headers: { 'content-type': 'application/json' },
        status: 404,
      });
    }

    const buffer = await generateDocxBuffer({
      sections: deliverable.sections,
      title: deliverable.title,
    });
    const sanitizedTitle = deliverable.title.replace(UNSAFE_FILENAME_CHARS, '_');

    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-disposition': `attachment; filename="${encodeURIComponent(sanitizedTitle)}.docx"`,
        'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown export error';
    const status = message === 'Authentication required.' ? 401 : 500;

    return new Response(JSON.stringify({ message, status }), {
      headers: { 'content-type': 'application/json' },
      status,
    });
  }
}

export { GET };
