import { z } from 'zod';

const createSessionRequestSchema = z.object({
  templateType: z.enum(['weekly_report', 'training_summary', 'policy_review']),
});

const createSourceRequestSchema = z.object({
  content: z.string().trim().min(1, '근거자료 내용을 입력해 주세요.'),
  label: z.string().trim().optional(),
  type: z.enum(['text', 'table', 'data']).optional(),
});

export { createSessionRequestSchema, createSourceRequestSchema };
