import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CaretRight, CheckCircle } from '@/components/ui';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { ACADEMY_MEMBERSHIP_FEATURE_KEYS } from '@/lib/academy-content/events';

export async function AcademyMembershipCard() {
  const t = await getTranslations('academy.landing');

  return (
    <div
      id="membership"
      className="border-border relative flex min-h-full scroll-mt-8 items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:border-l lg:px-16 lg:py-12"
    >
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

            <ul className="flex flex-col gap-2.5">
              {ACADEMY_MEMBERSHIP_FEATURE_KEYS.map((key) => (
                <li key={key} className="text-foreground flex items-start gap-2.5 text-sm">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0"
                    style={{ color: '#22c55e' }}
                    aria-hidden
                  />
                  {t(`features.${key}`)}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-6">
              <div className="border-border border-t pt-6">
                <PriceBlock
                  currency="CHF"
                  amount={t('membershipPriceAmount')}
                  notes={[t('membershipPricePeriod')]}
                  align="center"
                />
              </div>
              <Link
                href="#"
                className="font-display inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                {t('orderCta')}
                <CaretRight size={16} weight="bold" aria-hidden />
              </Link>
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
