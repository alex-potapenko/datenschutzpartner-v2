import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Gavel, ListChecks, MicrophoneStage } from '@/components/ui';
import {
  ACADEMY_OVERVIEW_FEATURE_KEYS,
  type AcademyOverviewFeatureKey,
} from '@/lib/academy-content/constants';

const FEATURE_ICONS: Record<AcademyOverviewFeatureKey, ReactNode> = {
  compliance: <Gavel size={24} weight="fill" aria-hidden />,
  sessions: <MicrophoneStage size={24} weight="fill" aria-hidden />,
  resources: <ListChecks size={24} weight="fill" aria-hidden />,
};

const FEATURE_ICON_STYLES: Record<
  AcademyOverviewFeatureKey,
  { color: string; background: string }
> = {
  compliance: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  sessions: {
    color: 'var(--feature-red)',
    background: 'color-mix(in srgb, var(--feature-red) 12%, transparent)',
  },
  resources: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

function FeatureIcon({ featureKey }: { featureKey: AcademyOverviewFeatureKey }) {
  const { color, background } = FEATURE_ICON_STYLES[featureKey];

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background, color }}
    >
      {FEATURE_ICONS[featureKey]}
    </div>
  );
}

export async function AcademyOverviewSection() {
  const t = await getTranslations('academy.landing.overview');

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 p-4 sm:p-8">
        <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{t('title')}</h2>
      </div>

      <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
        <p className="text-foreground text-base leading-relaxed">{t('intro')}</p>

        <ul className="flex flex-col gap-8">
          {ACADEMY_OVERVIEW_FEATURE_KEYS.map((key) => (
            <li key={key} className="flex gap-4">
              <FeatureIcon featureKey={key} />
              <div className="flex flex-col gap-1 pt-0.5">
                <p className="text-foreground text-base font-semibold">{t(`items.${key}.title`)}</p>
                <p className="text-muted text-base leading-relaxed">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
