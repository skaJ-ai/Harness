import type { UserRole } from '@/lib/db/schema';

interface AuthenticatedUser {
  employeeNumber: string;
  knoxId: string;
  loginId: string;
  name: string;
  role: UserRole;
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

interface AuthTokenPayload {
  role: UserRole;
  userId: string;
}

interface LoginRequestBody {
  loginId: string;
  password: string;
}

interface SignupRequestBody extends LoginRequestBody {
  employeeNumber: string;
  knoxId: string;
  name: string;
}

export type { AuthenticatedUser, AuthTokenPayload, LoginRequestBody, SignupRequestBody };
