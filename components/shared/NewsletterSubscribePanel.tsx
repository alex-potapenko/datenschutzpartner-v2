'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CalendarBlank, Sparkle } from '@/components/ui';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { NewsletterSubscribeCard } from '@/components/shared/NewsletterSubscribeCard';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';

const MEMBERSHIP_CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

const BENEFIT_KEYS = ['monthly', 'tips', 'offers'] as const;

type BenefitKey = (typeof BENEFIT_KEYS)[number];

const BENEFIT_ICONS: Record<BenefitKey, ReactNode> = {
  monthly: <CalendarBlank size={24} weight="fill" aria-hidden />,
  tips: <Sparkle size={24} weight="fill" aria-hidden />,
  offers: <Bell size={24} weight="fill" aria-hidden />,
};

const BENEFIT_ICON_STYLES: Record<BenefitKey, { color: string; background: string }> = {
  monthly: {
    color: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  },
  tips: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  offers: {
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

type NewsletterSubscribePanelProps = {
  showBottomBorder?: boolean;
};

export function NewsletterSubscribePanel({
  showBottomBorder = true,
}: NewsletterSubscribePanelProps) {
  const t = useTranslations('newsletter');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="bg-background">
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-3 p-4 sm:p-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
          </div>

          <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
            <p className="text-foreground text-base leading-relaxed">{t('bodyLine1')}</p>

            <ul className="flex flex-col gap-8">
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex gap-4">
                  <BenefitIcon benefitKey={key} />
                  <div className="flex flex-col gap-1 pt-0.5">
                    <p className="text-foreground text-base font-semibold">
                      {t(`benefits.${key}.title`)}
                    </p>
                    <p className="text-muted text-base leading-relaxed">
                      {t(`benefits.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:px-16 lg:py-12">
          <div className="relative flex w-full max-w-[440px] flex-col gap-4 overflow-visible">
            <HeroGlowOrbs />
            <div className="relative z-10 flex w-full flex-col gap-4">
              <div className="squircle w-full overflow-hidden" style={MEMBERSHIP_CARD_STYLE}>
                <div className="membership-soft-panel flex flex-col gap-6 p-4 sm:p-8">
                  {submitted ? null : (
                    <h3 className="text-foreground text-center text-xl font-semibold">
                      {t('cardTitle')}
                    </h3>
                  )}
                  <NewsletterSubscribeCard variant="embedded" onSubmittedChange={setSubmitted} />
                </div>
              </div>
              <p className="text-muted text-center text-xs leading-relaxed">{t('legalDataUse')}</p>
            </div>
          </div>
        </div>
      </div>

      {showBottomBorder ? <FullBleedDivider /> : null}
    </section>
  );
}
