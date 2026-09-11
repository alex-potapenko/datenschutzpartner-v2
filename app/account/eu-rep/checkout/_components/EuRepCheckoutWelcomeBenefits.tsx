'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, EnvelopeSimple } from '@/components/ui';

const BENEFIT_KEYS = ['art27', 'contact', 'inquiries'] as const;

type BenefitKey = (typeof BENEFIT_KEYS)[number];

const BENEFIT_ICONS: Record<BenefitKey, ReactNode> = {
  art27: (
    <span className="font-display text-xl leading-none font-bold" aria-hidden>
      §
    </span>
  ),
  contact: <Crosshair size={24} weight="bold" aria-hidden />,
  inquiries: <EnvelopeSimple size={24} weight="fill" aria-hidden />,
};

const BENEFIT_ICON_STYLES: Record<BenefitKey, { color: string; background: string }> = {
  art27: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  contact: {
    color: 'var(--feature-fuchsia)',
    background: 'color-mix(in oklab, var(--feature-fuchsia) 12%, transparent)',
  },
  inquiries: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

function BenefitIcon({ benefitKey }: { benefitKey: BenefitKey }) {
  const { color, background } = BENEFIT_ICON_STYLES[benefitKey];

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background, color }}
    >
      {BENEFIT_ICONS[benefitKey]}
    </div>
  );
}

export function EuRepCheckoutWelcomeBenefits() {
  const t = useTranslations('euRepPage.benefitsSection');

  return (
    <aside className="flex flex-col gap-8">
      <h2 className="text-foreground text-xl font-bold sm:text-2xl">{t('title')}</h2>
      <ul className="flex flex-col gap-6">
        {BENEFIT_KEYS.map((key) => (
          <li key={key} className="flex gap-4">
            <BenefitIcon benefitKey={key} />
            <div className="flex flex-col gap-1 pt-0.5">
              <p className="text-foreground text-sm font-semibold sm:text-base">
                {t(`items.${key}.title`)}
              </p>
              <p className="text-muted text-sm leading-relaxed">{t(`items.${key}.description`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
