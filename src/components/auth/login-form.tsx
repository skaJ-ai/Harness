'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { safeFetch } from '@/lib/utils';

interface LoginFormState {
  loginId: string;
  password: string;
}

type SubmissionStatus = 'idle' | 'submitting';

interface LoginResponseData {
  data: {
    user: {
      userId: string;
      workspaceId: string;
    };
  };
  message: string;
  status: number;
}

const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  loginId: '',
  password: '',
};

function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_LOGIN_FORM_STATE);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;

    setFormState((currentFormState) => ({
      ...currentFormState,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSubmissionStatus('submitting');

    const loginResponse = await safeFetch<LoginResponseData>('/api/auth/login', {
      body: JSON.stringify(formState),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    setSubmissionStatus('idle');

    if (!loginResponse.success) {
      setErrorMessage(loginResponse.error);
      return;
    }

    router.push('/workspace');
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        아이디
        <input
          className="input-surface"
          name="loginId"
          onChange={handleInputChange}
          placeholder="loginId"
          required
          type="text"
          value={formState.loginId}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        비밀번호
        <input
          className="input-surface"
          name="password"
          onChange={handleInputChange}
          placeholder="8자 이상"
          required
          type="password"
          value={formState.password}
        />
      </label>
      {errorMessage ? (
        <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-light)] px-4 py-3 text-sm text-[var(--color-error)]">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="btn-primary focus-ring"
        disabled={submissionStatus === 'submitting'}
        type="submit"
      >
        {submissionStatus === 'submitting' ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}

export { LoginForm };
