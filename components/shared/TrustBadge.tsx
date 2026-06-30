import { type ReactNode } from 'react';

interface TrustBadgeProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function TrustBadge({ icon, title, subtitle }: TrustBadgeProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="mb-3 flex size-6 items-center justify-center"
        style={{ color: 'var(--accent)' }}
      >
        {icon}
      </div>
      <p className="text-foreground text-base leading-tight font-semibold">{title}</p>
      <p className="text-muted text-sm">{subtitle}</p>
    </div>
  );
}
