import type { ReactNode } from 'react';
import { Chip } from '@/components/ui';

export type MetaBadgeKind = 'soon' | 'optional' | 'required' | 'trial' | 'notSubscribed';

const META_BADGE_COLOR: Record<MetaBadgeKind, 'default' | 'danger' | 'warning'> = {
  soon: 'default',
  optional: 'default',
  required: 'danger',
  trial: 'warning',
  notSubscribed: 'default',
};

/**
 * Meta labels — "Soon", "Optional", "Required", "Trial" — plain HeroUI Chip, no custom overrides.
 */
export function MetaBadge({
  kind = 'optional',
  size = 'sm',
  children,
  className,
}: {
  kind?: MetaBadgeKind;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}) {
  return (
    <Chip variant="soft" size={size} color={META_BADGE_COLOR[kind]} className={className}>
      {children}
    </Chip>
  );
}
