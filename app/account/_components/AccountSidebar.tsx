'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isPolicySubscriptionOnTrial, useSubscriptions } from '@/api/billing';
import { MetaBadge } from '@/components/shared/MetaBadge';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { useAccountScope, isEuRepAccountScope } from '@/components/shared/AccountScopeSwitcher';
import { SiteSwitcher, WebsiteSidebarSitePanel } from '@/components/shared/SiteSwitcher';
import { useSiteScope } from '@/components/shared/site-scope';
import { cn } from '@/components/ui';
import { AnimatedDirectionalPanel } from './AnimatedDirectionalPanel';
import { EuRepContractSidebarNav } from './EuRepContractSidebarNav';
import {
  ACCOUNT_SCOPE_IDS,
  SECTION_ACCENT,
  SECTION_ICON,
  WEBSITE_SECTION_IDS,
  isComingSoonSection,
  type WebsiteSectionId,
} from './account-sections';

type AccountSidebarProps = {
  active: WebsiteSectionId;
  onNavigate: (section: WebsiteSectionId) => void;
};

export function SidebarNav({ active, onNavigate }: AccountSidebarProps) {
  const t = useTranslations('account');
  const { activeSite } = useSiteScope();
  const subscriptions = useSubscriptions();

  const activeSiteOnPolicyTrial = useMemo(() => {
    const subscriptionId = activeSite?.document?.subscriptionId;
    if (!subscriptionId) return false;
    const subscription = subscriptions.data?.find((row) => row.id === subscriptionId);
    return isPolicySubscriptionOnTrial(subscription);
  }, [activeSite?.document?.subscriptionId, subscriptions.data]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex flex-col">
        {WEBSITE_SECTION_IDS.map((section) => {
          const Icon = SECTION_ICON[section];
          const accent = SECTION_ACCENT[section];
          const isActive = section === active;
          const comingSoon = isComingSoonSection(section);

          return (
            <button
              key={section}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                onNavigate(section);
              }}
              className={cn(
                'flex min-h-12 w-full cursor-pointer items-center gap-3 px-5 text-left text-sm font-medium transition-[color,background-color,box-shadow] duration-200',
                isActive
                  ? 'text-foreground'
                  : comingSoon
                    ? 'text-muted hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
                    : 'text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
              )}
              style={
                isActive
                  ? {
                      background: `color-mix(in oklab, ${accent} 10%, transparent)`,
                      boxShadow: `inset 2px 0 0 0 ${accent}`,
                    }
                  : undefined
              }
            >
              <Icon
                size={20}
                weight={isActive ? 'fill' : 'regular'}
                className="shrink-0"
                style={isActive ? { color: accent } : undefined}
              />
              <span className="min-w-0 flex-1 truncate">{t(`nav.${section}`)}</span>
              {section === 'privacyPolicy' && activeSiteOnPolicyTrial ? (
                <MetaBadge kind="trial" className="shrink-0">
                  {t('nav.trial')}
                </MetaBadge>
              ) : comingSoon ? (
                <MetaBadge kind="soon" className="shrink-0">
                  {t('nav.soon')}
                </MetaBadge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccountSidebarFooter() {
  const t = useTranslations('account.sidebarLinks');

  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <NavigationLink href="/contact" size="sm" chevron="none">
        {t('help')}
      </NavigationLink>
      <NavigationLink href="/terms" size="sm" chevron="none">
        {t('termsOfService')}
      </NavigationLink>
      <NavigationLink href="/privacy" size="sm" chevron="none">
        {t('privacyPolicy')}
      </NavigationLink>
    </div>
  );
}

const WEBSITE_SIDEBAR_PANEL_ORDER = ['sections', 'site-list'] as const;

export function AccountSidebar({ active, onNavigate }: AccountSidebarProps) {
  const t = useTranslations('account');
  const accountScope = useAccountScope();
  const isEuRepScope = isEuRepAccountScope(accountScope);
  const scopeKey = isEuRepScope ? 'euRep' : 'websites';
  const [siteListOpen, setSiteListOpen] = useState(false);
  const websitePanelKey = siteListOpen ? 'site-list' : 'sections';

  return (
    <nav className="flex h-full min-h-0 flex-1 flex-col" aria-label={t('title')}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatedDirectionalPanel
          activeKey={scopeKey}
          order={ACCOUNT_SCOPE_IDS}
          axis="y"
          className="flex min-h-0 flex-1 flex-col"
        >
          {isEuRepScope ? (
            <EuRepContractSidebarNav />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SiteSwitcher isOpen={siteListOpen} onOpenChange={setSiteListOpen} />
              <AnimatedDirectionalPanel
                activeKey={websitePanelKey}
                order={WEBSITE_SIDEBAR_PANEL_ORDER}
                axis="y"
                className="flex min-h-0 flex-1 flex-col"
              >
                {siteListOpen ? (
                  <WebsiteSidebarSitePanel
                    onSiteSelect={() => {
                      setSiteListOpen(false);
                    }}
                  />
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <SidebarNav active={active} onNavigate={onNavigate} />
                  </div>
                )}
              </AnimatedDirectionalPanel>
            </div>
          )}
        </AnimatedDirectionalPanel>
      </div>
      <AccountSidebarFooter />
    </nav>
  );
}
