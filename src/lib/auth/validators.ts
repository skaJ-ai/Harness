import { z } from 'zod';

const loginRequestSchema = z.object({
  loginId: z.string().trim().min(1, '아이디를 입력해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

const signupRequestSchema = loginRequestSchema.extend({
  employeeNumber: z.string().trim().min(1, '사번을 입력해 주세요.'),
  knoxId: z.string().trim().min(1, 'Knox ID를 입력해 주세요.'),
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
});

export { loginRequestSchema, signupRequestSchema };
