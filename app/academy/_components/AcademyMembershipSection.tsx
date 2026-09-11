import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AcademyMembershipIncludesList } from '@/components/shared/AcademyMembershipIncludesList';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { ArrowSquareOut } from '@/components/ui';
import { ACADEMY_MEMBERSHIP_EXTERNAL_URL } from '@/lib/academy-content/constants';

export async function AcademyMembershipCard() {
  const t = await getTranslations('academy.landing');

  return (
    <div className="border-border relative flex min-h-full items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-16 lg:py-12">
      <HeroGlowOrbs />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
        <div
          className="squircle w-full overflow-hidden"
          style={{
            border: '2px solid rgba(255,255,255,1)',
            background: 'rgba(255,255,255,0.6)',
            boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex flex-col gap-6 p-4 sm:p-8">
            <h2 className="text-foreground text-center text-xl font-semibold">
              {t('membershipTitle')}
            </h2>

            <PriceBlock
              currency="CHF"
              amount={t('membershipPriceAmount')}
              notes={[t('membershipPricePeriod')]}
              align="center"
            />

            <a
              href={ACADEMY_MEMBERSHIP_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display bg-key-500 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-8 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              {t('joinCta')}
              <ArrowSquareOut size={16} weight="bold" aria-hidden />
            </a>

            <div className="border-border border-t pt-6">
              <AcademyMembershipIncludesList featureLabel={(key) => t(`features.${key}`)} />
            </div>
          </div>
        </div>

        <p className="text-muted text-center text-xs leading-relaxed">
          {t('membershipLegalPrefix')} <Link href="/terms">{t('membershipTermsLink')}</Link>{' '}
          {t('membershipLegalSuffix')}
        </p>
      </div>
    </div>
  );
}
