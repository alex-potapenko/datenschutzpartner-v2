'use client';

import { useState } from 'react';
import { Cube } from '@/components/ui';
import { policyServiceFallbackIcon } from '@/lib/policy-services/fallback-icons';
import { policyServiceLogoUrl } from '@/lib/logo-dev';
import { usePaleImageTint } from '@/lib/use-pale-image-tint';

const LOGO_SIZES = {
  32: { box: 'size-8', image: 'size-5', imagePx: 20, icon: 18, cdn: 64, radius: 'rounded-lg' },
  64: { box: 'size-16', image: 'size-10', imagePx: 40, icon: 36, cdn: 128, radius: 'rounded-2xl' },
} as const;

function RequestedServiceFallback({ size }: { size: keyof typeof LOGO_SIZES }) {
  const dims = LOGO_SIZES[size];

  return (
    <span
      className={`bg-accent-soft flex ${dims.box} shrink-0 items-center justify-center ${dims.radius}`}
      aria-hidden
    >
      <Cube size={dims.icon} weight="fill" className="text-accent" />
    </span>
  );
}

function ServiceIconFallback({
  catalogId,
  name,
  size,
}: {
  catalogId?: string;
  name: string;
  size: keyof typeof LOGO_SIZES;
}) {
  const fallback = policyServiceFallbackIcon(catalogId, name);
  const Icon = fallback.icon;
  const dims = LOGO_SIZES[size];

  return (
    <span
      className={`flex ${dims.box} shrink-0 items-center justify-center ${dims.radius}`}
      style={{ background: fallback.background }}
      aria-hidden
    >
      <Icon size={dims.icon} weight="fill" style={{ color: fallback.color }} />
    </span>
  );
}

/** Vendor logo from logo.dev, falling back to a coloured Phosphor icon when no domain is known. */
export function ServiceLogo({
  name,
  logoDomain,
  catalogId,
  size = 32,
  fallback = 'catalog',
}: {
  name: string;
  logoDomain?: string;
  catalogId?: string;
  size?: keyof typeof LOGO_SIZES;
  /** `requested` keeps the blue cube when no domain or logo.dev has no image. */
  fallback?: 'catalog' | 'requested';
}) {
  const [failedDomain, setFailedDomain] = useState<string | null>(null);
  const dims = LOGO_SIZES[size];
  const failed = Boolean(logoDomain && failedDomain === logoDomain);
  const logoSrc = logoDomain && !failed ? policyServiceLogoUrl(logoDomain, dims.cdn) : undefined;
  const tint = usePaleImageTint(logoSrc);

  if (!logoSrc) {
    if (fallback === 'requested') {
      return <RequestedServiceFallback size={size} />;
    }

    return <ServiceIconFallback catalogId={catalogId} name={name} size={size} />;
  }

  return (
    <span
      className={`flex ${dims.box} shrink-0 items-center justify-center overflow-hidden ${dims.radius}`}
      style={{ background: tint }}
    >
      {/* logo.dev is designed for hotlinked images — see lib/logo-dev.ts */}
      {/* eslint-disable-next-line @next/next/no-img-element -- logo.dev CDN */}
      <img
        src={logoSrc}
        alt=""
        width={dims.imagePx}
        height={dims.imagePx}
        className={`${dims.image} object-contain`}
        loading="lazy"
        decoding="async"
        onError={() => {
          setFailedDomain(logoDomain ?? null);
        }}
      />
    </span>
  );
}
