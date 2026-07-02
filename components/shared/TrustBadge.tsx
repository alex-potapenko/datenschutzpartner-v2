import { type ReactNode } from 'react';

interface TrustBadgeProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function TrustBadge({ icon, title, subtitle }: TrustBadgeProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className="mb-3 flex size-6 items-center justify-center"
        style={{ color: 'var(--accent)' }}
      >
        {icon}
      </div>
      <p className="text-foreground text-sm leading-tight sm:text-base">
        {[title, subtitle].filter(Boolean).join(' ')}
      </p>
    </div>
  );
}
