import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { WorkspaceHeader } from '@/components/workspace/header';
import { getCurrentUser } from '@/lib/auth/session';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <WorkspaceHeader user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
