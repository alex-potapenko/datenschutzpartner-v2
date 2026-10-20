'use client';

import { useAffiliateDashboard, useMyAffiliateApplication } from '@/api/affiliate';

/** Affiliate secondary nav — only after approval (partner dashboard exists). Pending stays on the landing layout. */
export function useAffiliateSidebarNav() {
  const application = useMyAffiliateApplication();
  const dashboard = useAffiliateDashboard();
  const isLoading = application.isLoading || dashboard.isLoading;
  const isPartner = Boolean(dashboard.data);
  const visible = isPartner;

  return { visible, isPartner, isLoading };
}
