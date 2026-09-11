import type { ComponentType } from 'react';
import { FileText, FlagBanner } from '@/components/ui';

export const ALL_SUBSCRIPTIONS_TAB_IDS = ['privacyPolicy', 'euRep'] as const;

export type AllSubscriptionsTab = (typeof ALL_SUBSCRIPTIONS_TAB_IDS)[number];

type AllSubscriptionsTabIcon = ComponentType<{
  size?: number;
  weight?: 'fill' | 'regular';
  className?: string;
  'aria-hidden'?: boolean;
}>;

export const ALL_SUBSCRIPTIONS_TAB_ICON: Record<AllSubscriptionsTab, AllSubscriptionsTabIcon> = {
  privacyPolicy: FileText,
  euRep: FlagBanner,
};

export function isAllSubscriptionsTab(value: string | null): value is AllSubscriptionsTab {
  return value !== null && (ALL_SUBSCRIPTIONS_TAB_IDS as readonly string[]).includes(value);
}
