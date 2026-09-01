'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CaretRight, GraduationCap } from '@/components/ui';
import { AcademyOverviewFeatureIcon } from '@/components/shared/AcademyOverviewFeatureIcon';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { ACADEMY_OVERVIEW_FEATURE_KEYS } from '@/lib/academy-content/constants';
import { cn } from '@/lib/utils';

const MEMBERSHIP_CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

export type AcademyMembershipPromoSessionType = 'all' | 'webinars' | 'newsQuestions';

export type AcademyMembershipPromoBannerProps = {
  variant: 'horizontal' | 'vertical';
  sessionType: AcademyMembershipPromoSessionType;
  className?: string;
};

function titleKeyFor(sessionType: AcademyMembershipPromoSessionType) {
  switch (sessionType) {
    case 'webinars':
      return 'titleWebinars';
    case 'newsQuestions':
      return 'titleNewsQuestions';
    default:
      return 'titleAll';
  }
}

function PromoIntro({ titleKey }: { titleKey: string }) {
  const t = useTranslations('academy.membershipPromo');
  const tAcademy = useTranslations('academy.landing');

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p
        className="font-display inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        <GraduationCap size={20} weight="fill" aria-hidden />
        {tAcademy('heroTitle')}
      </p>
      <h2 className="font-display text-foreground text-2xl font-semibold">{t(titleKey)}</h2>
      <p className="text-foreground text-sm leading-snug">{t('descriptionLead')}</p>
      <p className="text-foreground text-sm leading-snug">{t('descriptionBody')}</p>
    </div>
  );
}

function PromoFeatures() {
  const tOverview = useTranslations('academy.landing.overview');

  return (
    <ul className="flex flex-col gap-4">
      {ACADEMY_OVERVIEW_FEATURE_KEYS.map((key) => (
        <li key={key} className="flex items-center gap-3">
          <AcademyOverviewFeatureIcon featureKey={key} />
          <p className="text-foreground text-sm leading-snug font-normal">
            {tOverview(`items.${key}.title`)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function PromoPricing() {
  const t = useTranslations('academy.membershipPromo');
  const tAcademy = useTranslations('academy.landing');

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border border-t pt-6">
        <PriceBlock
          currency="CHF"
          amount={tAcademy('membershipPriceAmount')}
          notes={[tAcademy('membershipPricePeriod')]}
        />
      </div>

      <Link
        href="/academy#membership"
        className="font-display inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium whitespace-nowrap text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--accent)' }}
      >
        {t('cta')}
        <CaretRight size={16} weight="bold" aria-hidden />
      </Link>

      <p className="text-muted text-sm">
        {t('loginPrompt')}{' '}
        <NavigationLink href="/login" chevron="none">
          {t('loginLink')}
        </NavigationLink>
      </p>
    </div>
  );
}

export function AcademyMembershipPromoBanner({
  variant,
  sessionType,
  className,
}: AcademyMembershipPromoBannerProps) {
  const titleKey = titleKeyFor(sessionType);

  return (
    <div className={cn('relative overflow-visible', className)}>
      <HeroGlowOrbs />

      <div className="relative z-10">
        <div className="squircle w-full overflow-hidden" style={MEMBERSHIP_CARD_STYLE}>
          {variant === 'horizontal' ? (
            <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] sm:gap-8 sm:p-8">
              <PromoIntro titleKey={titleKey} />

              <div aria-hidden className="bg-border hidden w-px sm:block" />

              <div className="border-border flex min-w-0 flex-col gap-4 border-t pt-6 sm:border-t-0 sm:pt-0">
                <PromoFeatures />
                <PromoPricing />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-4 sm:p-8">
              <PromoIntro titleKey={titleKey} />
              <PromoFeatures />
              <PromoPricing />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
