'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="surface flex max-w-md flex-col items-center gap-4 p-8 text-center shadow-[var(--shadow-2)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-light)] text-[var(--color-error)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">문제가 발생했습니다</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {error.message || '요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
        </p>
        <button className="btn-primary mt-4" onClick={() => reset()} type="button">
          다시 시도
        </button>
      </div>
    </div>
  );
}
