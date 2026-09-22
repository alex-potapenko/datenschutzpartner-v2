import { getTranslations } from 'next-intl/server';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { AFFILIATE_REGISTER_SECTION_ID } from '@/lib/affiliate-links';
import { AffiliateExampleTimeline } from './AffiliateExampleTimeline';
import { AffiliateRegistrationForm } from './AffiliateRegistrationForm';

const CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

export async function AffiliateHowItWorksSection() {
  const t = await getTranslations('affiliatePage.howItWorks');
  const tr = await getTranslations('affiliatePage.registration');

  return (
    <section id={AFFILIATE_REGISTER_SECTION_ID} className="scroll-mt-24">
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-3 p-4 sm:p-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
          </div>

          <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
            <AffiliateExampleTimeline />
          </div>
        </div>

        <div className="flex items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:px-16 lg:py-12">
          <div className="relative flex w-full max-w-[440px] flex-col gap-4 overflow-visible">
            <HeroGlowOrbs />
            <div className="relative z-10 flex w-full flex-col gap-4">
              <div className="squircle w-full overflow-hidden" style={CARD_STYLE}>
                <div className="membership-soft-panel flex flex-col gap-6 p-4 sm:p-8">
                  <h3 className="text-foreground text-center text-xl font-semibold">
                    {tr('cardTitle')}
                  </h3>
                  <AffiliateRegistrationForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
