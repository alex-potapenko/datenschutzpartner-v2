'use client';

import { NestedTopBar } from './topbars/NestedTopBar';
import { AccountTopBar } from './topbars/AccountTopBar';
import { PublicTopBar } from './topbars/PublicTopBar';
import type { TopBarBackLink } from './topbars/types';

export type { TopBarBackLink };

interface TopBarProps {
  activePath?: string;
  backLink?: TopBarBackLink;
  showLogo?: boolean;
  /** When true, only the back link is shown — no logo, nav, locale switcher, or actions. */
  minimal?: boolean;
  /** Account area: wordmark reads "My Account", no site nav or auth button. */
  variant?: 'public' | 'account';
}

export function TopBar({
  activePath,
  backLink,
  showLogo = true,
  minimal = false,
  variant = 'public',
}: TopBarProps) {
  const resolvedBackLink = backLink
    ? { ...backLink, iconOnly: backLink.iconOnly ?? minimal }
    : undefined;

  if (minimal) {
    return <NestedTopBar backLink={resolvedBackLink} />;
  }

  if (variant === 'account') {
    return <AccountTopBar showLogo={showLogo} />;
  }

  return <PublicTopBar activePath={activePath} backLink={backLink} showLogo={showLogo} />;
}
