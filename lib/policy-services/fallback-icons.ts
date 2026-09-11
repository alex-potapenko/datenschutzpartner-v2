import {
  Briefcase,
  EnvelopeSimple,
  Globe,
  Newspaper,
  PuzzlePiece,
  ShoppingCart,
  SignIn,
  Wrench,
} from '@/components/ui';

type ServiceIcon = typeof EnvelopeSimple;

export type PolicyServiceFallbackIcon = {
  icon: ServiceIcon;
  color: string;
  background: string;
};

const FALLBACK_BY_CATALOG_ID: Record<string, PolicyServiceFallbackIcon> = {
  'contact-form': {
    icon: EnvelopeSimple,
    color: '#2563eb',
    background: 'color-mix(in srgb, #2563eb 12%, white)',
  },
  'newsletter-form': {
    icon: Newspaper,
    color: '#7c3aed',
    background: 'color-mix(in srgb, #7c3aed 12%, white)',
  },
  'online-shop': {
    icon: ShoppingCart,
    color: '#059669',
    background: 'color-mix(in srgb, #059669 12%, white)',
  },
  'job-applications': {
    icon: Briefcase,
    color: '#d97706',
    background: 'color-mix(in srgb, #d97706 12%, white)',
  },
  'login-system': {
    icon: SignIn,
    color: '#dc2626',
    background: 'color-mix(in srgb, #dc2626 12%, white)',
  },
};

const DEFAULT_FALLBACK: PolicyServiceFallbackIcon = {
  icon: PuzzlePiece,
  color: '#2563eb',
  background: 'color-mix(in srgb, #2563eb 12%, white)',
};

const FALLBACK_POOL: PolicyServiceFallbackIcon[] = [
  DEFAULT_FALLBACK,
  {
    icon: Globe,
    color: '#0891b2',
    background: 'color-mix(in srgb, #0891b2 12%, white)',
  },
  {
    icon: Wrench,
    color: '#7c3aed',
    background: 'color-mix(in srgb, #7c3aed 12%, white)',
  },
  {
    icon: Briefcase,
    color: '#d97706',
    background: 'color-mix(in srgb, #d97706 12%, white)',
  },
];

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function policyServiceFallbackIcon(
  catalogId?: string,
  name?: string
): PolicyServiceFallbackIcon {
  if (catalogId && FALLBACK_BY_CATALOG_ID[catalogId]) {
    return FALLBACK_BY_CATALOG_ID[catalogId];
  }

  const key = catalogId ?? name ?? 'service';
  return FALLBACK_POOL[hashString(key) % FALLBACK_POOL.length] ?? DEFAULT_FALLBACK;
}
