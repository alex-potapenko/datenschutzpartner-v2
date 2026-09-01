'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEuRepContracts } from '@/api/eu-rep';
import { RegularPage } from '@/components/shared/RegularPage';
import { EuRepScopeProvider } from '@/components/shared/eu-rep-scope';
import { SiteScopeProvider } from '@/components/shared/site-scope';
import { List, X } from '@/components/ui';
import { AccountLayoutProvider } from './account-ui';
import { AccountSidebar } from './AccountSidebar';
import { AnimatedDirectionalPanel } from './AnimatedDirectionalPanel';
import {
  WEBSITE_SECTION_IDS,
  isEuRepAccountScope,
  normalizeAccountScope,
  normalizeWebsiteSection,
  type WebsiteSectionId,
} from './account-sections';
import { PrivacyPolicySection } from './sections/PrivacyPolicySection';
import { EuRepSection } from './sections/EuRepSection';
import { ComingSoonSection } from './sections/ComingSoonSection';
import { SubscriptionsSection } from './sections/SubscriptionsSection';

function readSectionFromUrl(searchParams: URLSearchParams): WebsiteSectionId {
  return normalizeWebsiteSection(searchParams.get('section'));
}

function useIsLargeScreen() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(min-width: 1024px)');
      media.addEventListener('change', onStoreChange);
      return () => {
        media.removeEventListener('change', onStoreChange);
      };
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => false
  );
}

function AccountSectionContent({
  section,
  onNavigate,
}: {
  section: WebsiteSectionId;
  onNavigate: (section: WebsiteSectionId) => void;
}) {
  switch (section) {
    case 'overview':
      return <SubscriptionsSection onNavigate={onNavigate} />;
    case 'privacyPolicy':
      return <PrivacyPolicySection />;
    case 'euRep':
      return <EuRepSection />;
    case 'cookieBanner':
      return <ComingSoonSection product="cookieBanner" />;
    case 'imprint':
      return <ComingSoonSection product="imprint" />;
  }
}

export function AccountShell() {
  const t = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLargeScreen = useIsLargeScreen();

  const section = readSectionFromUrl(searchParams);
  const siteParam = searchParams.get('site');
  const contractParam = searchParams.get('contract');
  const accountScope = normalizeAccountScope(searchParams.get('accountScope'));
  const inEuRepScope = isEuRepAccountScope(accountScope);
  const contracts = useEuRepContracts();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeEuRepContracts = useMemo(
    () => (contracts.data ?? []).filter((row) => row.status === 'active'),
    [contracts.data]
  );

  const euRepContractOrder = useMemo(
    () => activeEuRepContracts.map((row) => row.id),
    [activeEuRepContracts]
  );

  const activeEuRepContract = useMemo(() => {
    return (
      (contractParam ? activeEuRepContracts.find((row) => row.id === contractParam) : undefined) ??
      activeEuRepContracts[0] ??
      null
    );
  }, [contractParam, activeEuRepContracts]);

  const contentActiveKey = inEuRepScope ? (activeEuRepContract?.id ?? 'euRep-empty') : section;
  const contentOrder = inEuRepScope ? euRepContractOrder : WEBSITE_SECTION_IDS;

  const mobileNavTitle = inEuRepScope
    ? (activeEuRepContract?.legalEntity ?? t('nav.euRep'))
    : t(`nav.${section}`);

  const navigate = useCallback(
    (next: WebsiteSectionId) => {
      setMobileNavOpen(false);

      const params = new URLSearchParams(searchParams.toString());
      params.set('section', next);
      const currentScope = normalizeAccountScope(searchParams.get('accountScope'));
      if (!isEuRepAccountScope(currentScope)) {
        params.set('accountScope', 'websites');
      }

      router.replace(`/account?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, searchParams]
  );

  const selectSite = useCallback(
    (domain: string) => {
      setMobileNavOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      params.set('site', domain);
      router.replace(`/account?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const selectContract = useCallback(
    (contractId: string) => {
      setMobileNavOpen(false);
      const params = new URLSearchParams(searchParams.toString());
      params.set('contract', contractId);
      router.replace(`/account?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, searchParams]
  );

  return (
    <SiteScopeProvider siteParam={siteParam} onSelectSite={selectSite}>
      <EuRepScopeProvider contractParam={contractParam} onSelectContract={selectContract}>
        <RegularPage topBarVariant="account" showFooter={false} noPadding>
          <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-8 lg:hidden">
            <span className="font-display text-foreground min-w-0 truncate text-base font-semibold">
              {mobileNavTitle}
            </span>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen((open) => !open);
              }}
              aria-expanded={mobileNavOpen}
              aria-label={t('nav.openMenu')}
              className="border-border text-foreground flex size-11 shrink-0 items-center justify-center rounded-xl border"
            >
              {mobileNavOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>

          {mobileNavOpen ? (
            <div className="border-border border-b lg:hidden">
              <AccountSidebar active={section} onNavigate={navigate} />
            </div>
          ) : null}

          <AccountLayoutProvider mode={isLargeScreen ? 'split' : 'stack'}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible lg:grid lg:grid-cols-[280px_1fr]">
              <aside className="border-border sticky top-[var(--topbar-height,6rem)] hidden h-[calc(100dvh-var(--topbar-height,6rem))] min-h-0 w-[280px] shrink-0 flex-col self-stretch border-r lg:col-start-1 lg:row-start-1 lg:flex">
                <AccountSidebar active={section} onNavigate={navigate} />
              </aside>

              <div className="min-w-0 overflow-visible lg:col-start-2 lg:row-start-1 lg:min-h-0">
                <AnimatedDirectionalPanel
                  activeKey={contentActiveKey}
                  order={contentOrder}
                  axis="y"
                >
                  <AccountSectionContent section={section} onNavigate={navigate} />
                </AnimatedDirectionalPanel>
              </div>
            </div>
          </AccountLayoutProvider>
        </RegularPage>
      </EuRepScopeProvider>
    </SiteScopeProvider>
  );
}
