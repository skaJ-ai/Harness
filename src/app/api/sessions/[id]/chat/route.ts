import { convertToModelMessages, safeValidateUIMessages, streamText } from 'ai';

import { getChatModel } from '@/lib/ai/provider';
import {
  buildInterviewContext,
  createMetadataCommentTransform,
  extractTextFromUiMessage,
  parseAssistantMetadata,
} from '@/lib/ai/session-chat';
import { requireAuthenticatedApiUser } from '@/lib/auth/middleware';
import {
  createAssistantMessageForSession,
  createUserMessageForSession,
  getSessionPromptContext,
} from '@/lib/sessions/service';

export const maxDuration = 30;

async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireAuthenticatedApiUser();
    const requestBody = (await request.json()) as { messages?: unknown };
    const validatedMessages = await safeValidateUIMessages({
      messages: requestBody.messages,
    });

    if (!validatedMessages.success) {
      return new Response(
        JSON.stringify({
          message: '채팅 메시지 형식이 올바르지 않습니다.',
          status: 400,
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
        },
      );
    }

    const requestMessages = validatedMessages.data;
    const lastUserMessage = requestMessages.at(-1);
    const { id } = await params;

    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return new Response(
        JSON.stringify({
          message: '사용자 메시지가 필요합니다.',
          status: 400,
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
        },
      );
    }

    const userMessageText = extractTextFromUiMessage(lastUserMessage);

    if (userMessageText.length === 0) {
      return new Response(
        JSON.stringify({
          message: '메시지 내용을 입력해 주세요.',
          status: 400,
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 400,
        },
      );
    }

    await createUserMessageForSession({
      content: userMessageText,
      sessionId: id,
      uiMessageId: lastUserMessage.id,
      workspaceId: currentUser.workspaceId,
    });

    const promptContext = await getSessionPromptContext({
      sessionId: id,
      workspaceId: currentUser.workspaceId,
    });
    const modelMessages = promptContext.messages.map((message, index) => ({
      id: `${id}-${index}`,
      parts: [
        {
          text: message.content,
          type: 'text' as const,
        },
      ],
      role: message.role,
    }));
    let rawAssistantText = '';

    const result = streamText({
      experimental_transform: createMetadataCommentTransform(),
      messages: await convertToModelMessages(modelMessages),
      model: getChatModel(),
      onChunk({ chunk }) {
        if (chunk.type === 'text-delta') {
          rawAssistantText += chunk.text;
        }
      },
      system: buildInterviewContext({
        currentChecklist: promptContext.checklist,
        recentDeliverables: promptContext.recentDeliverables,
        sources: promptContext.sources,
        templateType: promptContext.templateType,
      }),
      temperature: 0.4,
    });

    return result.toUIMessageStreamResponse({
      onError: () => 'AI 응답 생성 중 오류가 발생했습니다.',
      onFinish: async ({ isAborted, responseMessage }) => {
        if (isAborted) {
          return;
        }

        const parsedAssistantMetadata = parseAssistantMetadata(rawAssistantText);
        const assistantContent =
          parsedAssistantMetadata.visibleText || extractTextFromUiMessage(responseMessage);

        await createAssistantMessageForSession({
          canvas: parsedAssistantMetadata.canvas ?? undefined,
          checklist: parsedAssistantMetadata.checklist ?? promptContext.checklist,
          content: assistantContent,
          sessionId: id,
          uiMessageId: responseMessage.id,
          workspaceId: currentUser.workspaceId,
        });
      },
      originalMessages: requestMessages,
      sendReasoning: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown chat error';
    const status =
      message === 'Authentication required.'
        ? 401
        : message === '세션을 찾을 수 없습니다.'
          ? 404
          : 500;

    return new Response(
      JSON.stringify({
        message,
        status,
      }),
      {
        headers: {
          'content-type': 'application/json',
        },
        status,
      },
    );
  }
}

export { POST };
