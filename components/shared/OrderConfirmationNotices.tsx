'use client';

import type { ReactNode } from 'react';
import { NewsletterConfirmationNotice } from '@/components/shared/NewsletterConfirmationNotice';

type OrderConfirmationNoticesProps = {
  trialNotice?: ReactNode;
  newsletterOptIn?: boolean;
};

/** Trial and newsletter callouts below the order summary on confirmation screens. */
export function OrderConfirmationNotices({
  trialNotice,
  newsletterOptIn = false,
}: OrderConfirmationNoticesProps) {
  if (!trialNotice && !newsletterOptIn) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {trialNotice}
      {newsletterOptIn ? <NewsletterConfirmationNotice /> : null}
    </div>
  );
}
