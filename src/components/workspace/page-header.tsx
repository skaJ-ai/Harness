import type { ReactNode } from 'react';

interface WorkspacePageHeaderProps {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  title: string;
}

function WorkspacePageHeader({
  actions,
  description,
  eyebrow,
  meta,
  title,
}: WorkspacePageHeaderProps) {
  return (
    <section className="surface overflow-hidden px-6 py-6 shadow-[var(--shadow-2)] lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-4">
          {eyebrow ? <span className="badge badge-neutral w-fit">{eyebrow}</span> : null}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] lg:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm leading-7 text-[var(--color-text-secondary)] lg:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export { WorkspacePageHeader };
export type { WorkspacePageHeaderProps };
