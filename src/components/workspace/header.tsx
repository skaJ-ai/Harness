'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import type { AuthenticatedUser } from '@/lib/auth/types';
import { safeFetch } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href: '/workspace',
    label: '대시보드',
  },
  {
    href: '/workspace/new',
    label: '새 작업',
  },
];

function getCurrentAreaLabel(pathname: string): string {
  if (pathname.startsWith('/workspace/session/')) {
    return '인터뷰 캔버스';
  }

  if (pathname.startsWith('/workspace/asset/')) {
    return '산출물 뷰어';
  }

  if (pathname.startsWith('/workspace/new')) {
    return '새 작업 설계';
  }

  return '워크스페이스 대시보드';
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/workspace') {
    return pathname === '/workspace';
  }

  return pathname.startsWith(href);
}

export function WorkspaceHeader({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await safeFetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-[var(--color-bg-elevated)]/92 sticky top-0 z-50 border-b border-[var(--color-border)] px-6 py-4 shadow-[var(--shadow-1)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <Link className="flex flex-col gap-1" href="/workspace">
            <span className="text-xl font-bold tracking-tight text-[var(--color-accent)]">
              HARP
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              HR AI Report Platform
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-[var(--color-text)]">{user.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{user.workspaceName}</p>
            </div>
            <button
              className="btn-secondary px-3 py-2 text-xs"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? '로딩...' : '로그아웃'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-3 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  className="workspace-nav-link"
                  data-active={isActive}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-neutral">{getCurrentAreaLabel(pathname)}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              private workspace · {user.loginId}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
