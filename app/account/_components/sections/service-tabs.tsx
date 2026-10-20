'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AnimatedDirectionalPanel } from '../AnimatedDirectionalPanel';

/**
 * Tabs a subscribable service section can expose. `preview` is only meaningful for
 * services that host a document, so sections pass the subset they need.
 */
export const SERVICE_TAB_IDS = [
  'details',
  'about',
  'subscription',
  'instructions',
  'legalEntity',
  'preview',
  'faq',
  'overview',
  'links',
  'vouchers',
  'visits',
  'referrals',
  'payouts',
  'settings',
] as const;

export type ServiceTabId = (typeof SERVICE_TAB_IDS)[number];

/** Tabs shared by every service section, in display order. */
export const BASE_SERVICE_TAB_IDS = [
  'subscription',
  'instructions',
  'faq',
] as const satisfies readonly ServiceTabId[];

/** Tabs for the EU Representation service section. */
export const EU_REP_TAB_IDS = [
  'subscription',
  'legalEntity',
  'faq',
] as const satisfies readonly ServiceTabId[];

export function parseEuRepTab(value: string | null | undefined): ServiceTabId | undefined {
  if (!value) return undefined;
  return EU_REP_TAB_IDS.find((id) => id === value);
}

/** Tabs for an active affiliate partner in the account area. */
export const AFFILIATE_PARTNER_TAB_IDS = [
  'overview',
  'links',
  'vouchers',
  'visits',
  'referrals',
  'payouts',
  'settings',
] as const satisfies readonly ServiceTabId[];

/** Before approval the section only shows the program landing (no sub-nav). */
export const AFFILIATE_APPLICANT_TAB_IDS = ['overview'] as const satisfies readonly ServiceTabId[];

export const AFFILIATE_PARTNER_DEFAULT_TAB: ServiceTabId = 'overview';

export function affiliateTabIds(isPartner: boolean): readonly ServiceTabId[] {
  return isPartner ? AFFILIATE_PARTNER_TAB_IDS : AFFILIATE_APPLICANT_TAB_IDS;
}

export function parseAffiliateTab(
  value: string | null | undefined,
  isPartner: boolean
): ServiceTabId {
  return affiliateTabIds(isPartner).find((id) => id === value) ?? AFFILIATE_PARTNER_DEFAULT_TAB;
}

export function useServiceTabs(
  ids: readonly ServiceTabId[] = BASE_SERVICE_TAB_IDS
): ReadonlyArray<{ id: ServiceTabId; label: string }> {
  const t = useTranslations('account.serviceTabs');

  return useMemo(() => ids.map((id) => ({ id, label: t(id) })), [ids, t]);
}

/**
 * Framer Motion panel swap for service tabs — vertical slide by switch direction (same as
 * main account section navigation). Safe with HeroUI because the Tabs list lives outside
 * this tree in AccountSectionFrame.
 */
export function AnimatedServiceTabContent({
  tabKey,
  tabOrder,
  children,
  className,
  axis = 'y',
}: {
  tabKey: string;
  /** Display order of tabs — used to resolve forward vs back. */
  tabOrder: readonly string[];
  children: ReactNode;
  className?: string;
  /** `y` for product sub-tabs (default); pass `x` if a screen needs horizontal motion. */
  axis?: 'x' | 'y';
}) {
  return (
    <AnimatedDirectionalPanel
      activeKey={tabKey}
      order={tabOrder}
      axis={axis}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
    >
      {children}
    </AnimatedDirectionalPanel>
  );
}
