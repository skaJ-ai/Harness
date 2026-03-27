import { AuthShell } from '@/components/auth/auth-shell';
import { SignupForm } from '@/components/auth/signup-form';
import { redirectAuthenticatedUser } from '@/lib/auth/middleware';

export default async function SignupPage() {
  await redirectAuthenticatedUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-12">
      <AuthShell
        description="회원가입 직후 private workspace가 자동으로 생성되고 바로 작업을 시작할 수 있습니다."
        linkHref="/login"
        linkLabel="이미 계정이 있으신가요?"
        linkText="로그인"
        title="회원가입"
      >
        <SignupForm />
      </AuthShell>
    </main>
  );
}
