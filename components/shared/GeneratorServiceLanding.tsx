'use client';

import { GeneratorBenefitsPanel } from '@/app/scan/_components/GeneratorBenefitsPanel';
import { GeneratorHeroContent } from '@/app/scan/_components/GeneratorHeroContent';
import { GeneratorLandingFaqSection } from '@/app/scan/_components/GeneratorLandingFaqSection';
import { GeneratorStatsRowPanel } from '@/app/scan/_components/GeneratorStatsRowPanel';

type GeneratorServiceLandingProps = {
  domain?: string;
  fillSubscriptionId?: string;
};

/** Privacy Generator marketing content — same blocks as `/scan`, embedded in the account area. */
export function GeneratorServiceLanding({
  domain,
  fillSubscriptionId,
}: GeneratorServiceLandingProps) {
  return (
    <div className="bg-background">
      <section className="border-border border-b">
        <GeneratorHeroContent
          fillSubscriptionId={fillSubscriptionId}
          initialDomain={domain}
          showImage={false}
        />
      </section>
      <GeneratorStatsRowPanel />
      <GeneratorBenefitsPanel />
      <GeneratorLandingFaqSection />
    </div>
  );
}
