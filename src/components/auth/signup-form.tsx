'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { safeFetch } from '@/lib/utils';

interface SignupFormState {
  employeeNumber: string;
  knoxId: string;
  loginId: string;
  name: string;
  password: string;
}

type SubmissionStatus = 'idle' | 'submitting';

interface SignupResponseData {
  data: {
    user: {
      userId: string;
      workspaceId: string;
    };
  };
  message: string;
  status: number;
}

const INITIAL_SIGNUP_FORM_STATE: SignupFormState = {
  employeeNumber: '',
  knoxId: '',
  loginId: '',
  name: '',
  password: '',
};

function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [formState, setFormState] = useState<SignupFormState>(INITIAL_SIGNUP_FORM_STATE);
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

    const signupResponse = await safeFetch<SignupResponseData>('/api/auth/signup', {
      body: JSON.stringify(formState),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    setSubmissionStatus('idle');

    if (!signupResponse.success) {
      setErrorMessage(signupResponse.error);
      return;
    }

    router.push('/workspace');
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        이름
        <input
          className="input-surface"
          name="name"
          onChange={handleInputChange}
          placeholder="홍길동"
          required
          type="text"
          value={formState.name}
        />
      </label>
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
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        사번
        <input
          className="input-surface"
          name="employeeNumber"
          onChange={handleInputChange}
          placeholder="20260001"
          required
          type="text"
          value={formState.employeeNumber}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-text)]">
        Knox ID
        <input
          className="input-surface"
          name="knoxId"
          onChange={handleInputChange}
          placeholder="knox.id"
          required
          type="text"
          value={formState.knoxId}
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
        {submissionStatus === 'submitting' ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
}

export { SignupForm };
