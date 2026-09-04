'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowsClockwise, FlagBanner, LinkSimple, Stack } from '@/components/ui';
import { VolumeDiscountInfoTooltip } from '@/components/shared/VolumeDiscountDialog';

const BASE_BENEFIT_KEYS = ['hosted', 'updates', 'moreSites'] as const;
const EU_REP_BENEFIT_KEY = 'euRep' as const;

type BaseBenefitKey = (typeof BASE_BENEFIT_KEYS)[number];
type BenefitKey = BaseBenefitKey | typeof EU_REP_BENEFIT_KEY;

const BENEFIT_ICONS: Record<BenefitKey, ReactNode> = {
  hosted: <LinkSimple size={24} weight="regular" aria-hidden />,
  euRep: <FlagBanner size={24} weight="regular" aria-hidden />,
  updates: <ArrowsClockwise size={24} weight="regular" aria-hidden />,
  moreSites: <Stack size={24} weight="regular" aria-hidden />,
};

const BENEFIT_ICON_STYLES: Record<BenefitKey, { color: string; background: string }> = {
  hosted: {
    color: 'var(--warning)',
    background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
  },
  euRep: {
    color: 'var(--feature-indigo)',
    background: 'color-mix(in srgb, var(--feature-indigo) 12%, transparent)',
  },
  updates: {
    color: 'var(--feature-teal)',
    background: 'color-mix(in srgb, var(--feature-teal) 12%, transparent)',
  },
  moreSites: {
    color: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  },
};

function benefitKeys(includeEuRep: boolean): BenefitKey[] {
  if (!includeEuRep) return [...BASE_BENEFIT_KEYS];
  return ['hosted', EU_REP_BENEFIT_KEY, 'updates', 'moreSites'];
}

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

function BenefitTitle({ benefitKey }: { benefitKey: BenefitKey }) {
  const t = useTranslations('result.summary.benefits');

  switch (benefitKey) {
    case 'hosted':
      return t('items.hosted.title');
    case 'euRep':
      return t('items.euRep.title');
    case 'updates':
      return t('items.updates.title');
    case 'moreSites':
      return t('items.moreSites.title');
  }
}

function BenefitDescription({ benefitKey, domain }: { benefitKey: BenefitKey; domain: string }) {
  const t = useTranslations('result.summary.benefits');

  switch (benefitKey) {
    case 'hosted':
      return <>{t('items.hosted.description', { domain })}</>;
    case 'euRep':
      return <>{t('items.euRep.description')}</>;
    case 'updates':
      return <>{t('items.updates.description')}</>;
    case 'moreSites':
      return t.rich('items.moreSites.description', {
        info: () => (
          <span className="ml-1 inline-flex align-middle">
            <VolumeDiscountInfoTooltip />
          </span>
        ),
      });
  }
}

export function SummaryWelcomeBenefits({
  domain,
  includeEuRep = false,
}: {
  domain: string;
  includeEuRep?: boolean;
}) {
  const t = useTranslations('result.summary.benefits');
  const keys = useMemo(() => benefitKeys(includeEuRep), [includeEuRep]);

  return (
    <aside className="flex flex-col gap-8">
      <h2 className="text-foreground text-xl font-bold sm:text-2xl">{t('title')}</h2>

      <ul className="flex flex-col gap-6">
        {keys.map((key) => (
          <li key={key} className="flex gap-4">
            <BenefitIcon benefitKey={key} />
            <div className="flex flex-col gap-1 pt-0.5">
              <p className="text-foreground text-sm font-semibold sm:text-base">
                <BenefitTitle benefitKey={key} />
              </p>
              <div className="text-muted text-sm leading-relaxed">
                <BenefitDescription benefitKey={key} domain={domain} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
