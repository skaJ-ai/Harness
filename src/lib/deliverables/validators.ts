import { z } from 'zod';

const updateDeliverableRequestSchema = z
  .object({
    markdown: z.string().trim().min(1, 'Markdown 내용을 입력해 주세요.').optional(),
    status: z.enum(['draft', 'final', 'promoted_asset']).optional(),
    title: z.string().trim().min(1, '제목을 입력해 주세요.').optional(),
  })
  .refine(
    (value) =>
      value.markdown !== undefined || value.status !== undefined || value.title !== undefined,
    {
      message: '수정할 값이 필요합니다.',
      path: ['title'],
    },
  );

export { updateDeliverableRequestSchema };
