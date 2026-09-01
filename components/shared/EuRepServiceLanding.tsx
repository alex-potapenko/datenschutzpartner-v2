'use client';

import { EuRepBenefitsPanel } from '@/app/eu-rep/_components/EuRepBenefitsPanel';
import { EuRepHeroContent } from '@/app/eu-rep/_components/EuRepHeroContent';
import { EuRepLandingFaqSection } from '@/app/eu-rep/_components/EuRepLandingFaqSection';
import { EuRepStatsRowPanel } from '@/app/eu-rep/_components/EuRepStatsRowPanel';

type EuRepServiceLandingProps = {
  questionnaireReturnTo?: string;
  checkoutReturnTo?: string;
};

/** EU Representation marketing content — same blocks as `/eu-rep`, embedded in the account area. */
export function EuRepServiceLanding({
  questionnaireReturnTo,
  checkoutReturnTo,
}: EuRepServiceLandingProps) {
  return (
    <div className="bg-background">
      <section className="border-border border-b">
        <EuRepHeroContent questionnaireReturnTo={questionnaireReturnTo} showImage={false} />
      </section>
      <EuRepStatsRowPanel />
      <EuRepBenefitsPanel checkoutReturnTo={checkoutReturnTo} />
      <EuRepLandingFaqSection />
    </div>
  );
}
