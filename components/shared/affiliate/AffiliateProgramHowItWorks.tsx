'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { HeroGlowOrbs } from '@/components/shared/HeroGlowOrbs';
import { AffiliateApplicationForm } from '@/components/shared/AffiliateApplicationForm';
import { AFFILIATE_REGISTER_SECTION_ID } from '@/lib/affiliate-links';
import { AffiliateApplicationStatusCard } from './AffiliateApplicationStatusCard';
import { AffiliateProgramExampleTimeline } from './AffiliateProgramExampleTimeline';

const CARD_STYLE = {
  border: '2px solid rgba(255,255,255,1)',
  background: 'rgba(255,255,255,0.6)',
  boxShadow: '0 12px 64px rgba(0,0,0,0.08)',
} as const;

type AffiliateProgramHowItWorksProps = {
  showForm?: boolean;
  /** Pending application — same aside shell as the form (no layout swap). */
  applicationPending?: boolean;
  /** When set, form uses account field layout (e.g. embedded in Mein Konto). */
  formVariant?: 'landing' | 'account';
  registerSectionId?: boolean;
};

function AffiliateRegistrationAside({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-center overflow-visible border-t px-4 py-8 sm:px-8 sm:py-10 lg:border-t-0 lg:px-16 lg:py-12">
      <div className="relative flex w-full max-w-[440px] flex-col gap-4 overflow-visible">
        <HeroGlowOrbs />
        <div className="relative z-10 flex w-full flex-col gap-4">
          <div className="squircle w-full overflow-hidden" style={CARD_STYLE}>
            <div className="membership-soft-panel flex flex-col gap-6 p-4 sm:p-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AffiliateProgramHowItWorks({
  showForm = true,
  applicationPending = false,
  formVariant = 'landing',
  registerSectionId = true,
}: AffiliateProgramHowItWorksProps) {
  const pendingInFormColumn = applicationPending;
  const t = useTranslations('affiliatePage.howItWorks');
  const tr = useTranslations('affiliatePage.registration');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  return (
    <section
      id={registerSectionId ? AFFILIATE_REGISTER_SECTION_ID : undefined}
      className="scroll-mt-24 overflow-visible"
    >
      <div className="grid grid-cols-1 items-stretch overflow-visible lg:grid-cols-2">
        <div className="flex h-full min-w-0 flex-col overflow-visible">
          <div className="flex flex-col gap-3 p-4 sm:p-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
          </div>

          <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
            <AffiliateProgramExampleTimeline />
          </div>
        </div>

        {showForm ? (
          <AffiliateRegistrationAside>
            {pendingInFormColumn ? (
              <AffiliateApplicationStatusCard />
            ) : (
              <>
                <h3 className="text-foreground text-center text-xl font-semibold">
                  {applicationSubmitted ? tr('successTitle') : tr('cardTitle')}
                </h3>
                <AffiliateApplicationForm
                  variant={formVariant}
                  onSubmittedChange={setApplicationSubmitted}
                />
              </>
            )}
          </AffiliateRegistrationAside>
        ) : null}
      </div>
    </section>
  );
}
