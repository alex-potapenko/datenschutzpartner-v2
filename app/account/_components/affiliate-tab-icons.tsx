import {
  ArrowsLeftRight,
  CursorClick,
  GridFour,
  LinkSimple,
  Gear,
  Receipt,
  Tag,
} from '@/components/ui';
import type { ServiceTabId } from './sections/service-tabs';

type AffiliateTabIcon = typeof GridFour;

/** Icons for affiliate program sub-navigation (account sidebar). */
export const AFFILIATE_TAB_ICON: Partial<Record<ServiceTabId, AffiliateTabIcon>> = {
  overview: GridFour,
  links: LinkSimple,
  referrals: ArrowsLeftRight,
  visits: CursorClick,
  payouts: Receipt,
  vouchers: Tag,
  settings: Gear,
};

export const AFFILIATE_TAB_ACCENT = 'var(--accent)';
