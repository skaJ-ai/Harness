import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { redirectAuthenticatedUser } from '@/lib/auth/middleware';

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-12">
      <AuthShell
        description="기존 작업을 이어서 시작하고, private workspace에서 표준 HR 산출물을 정리하세요."
        linkHref="/signup"
        linkLabel="아직 계정이 없으신가요?"
        linkText="회원가입"
        title="로그인"
      >
        <LoginForm />
      </AuthShell>
    </main>
  );
}
