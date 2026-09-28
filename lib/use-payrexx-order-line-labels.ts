'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { PayrexxOrderLineLabels } from '@/lib/payrexx-order-lines';

export function usePayrexxOrderLineLabels(): PayrexxOrderLineLabels {
  const tActivate = useTranslations('result.summary.activate');
  const tGenerator = useTranslations('account.generatorCheckout');
  const tSummary = useTranslations('result.summary');
  const tRenewal = useTranslations('account.renewalCheckout');
  const tEuRep = useTranslations('euRepPage');

  return useMemo(
    () => ({
      policyTitle: tActivate('policyTitle'),
      euRepTitle: tActivate('euRepTitle'),
      policyDetail: (domain: string) => tActivate('policyDetail', { domain }),
      generatorSitesDetail: (count: number) => tGenerator('confirmationDetail', { count }),
      euRepDetail: (entity: string) => tActivate('euRepDetail', { entity }),
      euRepDetailFallback: tActivate('euRepDetailFallback'),
      euRepPlanLine: (plan: string) => tRenewal('euRepPlanLine', { plan }),
      euRepPlanName: (planId: string) => tEuRep(`plans.${planId}.name`),
      generatorHostingDetail: (domain: string) => tSummary('generatorLineDetail', { domain }),
      renewalWebsitesDetail: (count: number) => tRenewal('websitesDetail', { count }),
    }),
    [tActivate, tEuRep, tGenerator, tSummary, tRenewal]
  );
}
