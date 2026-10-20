'use client';

import { AffiliateProgramHowItWorks } from '@/components/shared/affiliate/AffiliateProgramHowItWorks';
import { AffiliateProgramStats } from '@/components/shared/affiliate/AffiliateProgramStats';

type AffiliateServiceLandingProps = {
  showRegistrationForm?: boolean;
  applicationPending?: boolean;
  /** Narrower stats grid until xl — only when embedded beside the account sidebar. */
  embeddedInAccount?: boolean;
  formVariant?: 'landing' | 'account';
};

/** Affiliate marketing blocks — same layout as `/affiliate`, without the hero. */
export function AffiliateServiceLanding({
  showRegistrationForm = true,
  applicationPending = false,
  embeddedInAccount = false,
  formVariant,
}: AffiliateServiceLandingProps) {
  const resolvedFormVariant = formVariant ?? (embeddedInAccount ? 'account' : 'landing');

  return (
    <div className="bg-background min-w-0 overflow-visible">
      <AffiliateProgramStats embeddedInAccount={embeddedInAccount} />
      <AffiliateProgramHowItWorks
        showForm={showRegistrationForm}
        applicationPending={applicationPending}
        formVariant={resolvedFormVariant}
        registerSectionId
      />
    </div>
  );
}
