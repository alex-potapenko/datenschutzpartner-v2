import type { ReactNode } from 'react';
import { Chip, cn } from '@/components/ui';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CHIP: Record<
  StatusTone,
  {
    color?: 'success' | 'warning' | 'danger';
    className?: string;
  }
> = {
  success: { color: 'success' },
  warning: { color: 'warning' },
  danger: { color: 'danger' },
  neutral: {
    className:
      '[--chip-bg:color-mix(in_srgb,var(--foreground)_6%,transparent)] [--chip-fg:var(--muted)]',
  },
};

/**
 * Color-coded status pill built on HeroUI Chip — consistent semantics across
 * the member area (Active / Processing / Update available / Cancelled …).
 */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const { color, className: toneClass } = TONE_CHIP[tone];

  return (
    <Chip variant="soft" size="sm" color={color} className={cn(toneClass, className)}>
      {children}
    </Chip>
  );
}

/** Maps a billing / membership status key to a pill tone. */
export function statusTone(status: string): StatusTone {
  switch (status) {
    case 'active':
      return 'success';
    case 'processing':
      return 'warning';
    case 'cancelled':
      return 'danger';
    case 'expired':
      return 'neutral';
    default:
      return 'neutral';
  }
}
