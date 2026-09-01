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

export function EuRepWizardBenefitsPanel() {
  const tb = useTranslations('euRepPage.benefitsSection');

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 p-4 sm:p-8">
        <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{tb('title')}</h2>
      </div>

      <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
        <p className="text-foreground text-base leading-relaxed">{tb('subtitle')}</p>

        <ul className="flex flex-col gap-8">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex gap-4">
              <BenefitIcon benefitKey={key} />
              <div className="flex flex-col gap-1 pt-0.5">
                <p className="text-foreground text-base font-semibold">
                  {tb(`items.${key}.title`)}
                </p>
                <p className="text-muted text-base leading-relaxed">
                  {tb(`items.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
