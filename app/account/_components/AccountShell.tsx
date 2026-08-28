'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { clearAuthToken } from '@/lib/auth-session';
import { RegularPage } from '@/components/shared/RegularPage';
import { List, SignOut, X, Button, useOverlayState } from '@/components/ui';
import { AccountHeaderRule, AccountLayoutProvider, ConfirmDialog } from './account-ui';
import { AccountSidebar, SidebarNav, SidebarUser } from './AccountSidebar';
import { isAccountSection, type AccountSectionId } from './account-sections';
import { DashboardSection } from './sections/DashboardSection';
import { GeneratorSection } from './sections/GeneratorSection';
import { AcademySection } from './sections/AcademySection';
import { EuRepSection } from './sections/EuRepSection';
import {
  AccountDetailsSection,
  isAccountDetailsTab,
  type AccountDetailsTab,
} from './sections/AccountDetailsSection';

function readSectionFromUrl(searchParams: URLSearchParams): AccountSectionId {
  const value = searchParams.get('section');
  return isAccountSection(value) ? value : 'dashboard';
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
  accountDetailsTab,
  onAccountDetailsTabChange,
}: {
  section: AccountSectionId;
  onNavigate: (section: AccountSectionId, options?: { tab?: AccountDetailsTab }) => void;
  accountDetailsTab: AccountDetailsTab;
  onAccountDetailsTabChange: (tab: AccountDetailsTab) => void;
}) {
  switch (section) {
    case 'dashboard':
      return <DashboardSection onNavigate={onNavigate} />;
    case 'generator':
      return (
        <GeneratorSection
          onNavigateToAccountDetails={() => {
            onNavigate('accountDetails', { tab: 'paymentDetails' });
          }}
        />
      );
    case 'academy':
      return (
        <AcademySection
          onNavigateToAccountDetails={() => {
            onNavigate('accountDetails', { tab: 'paymentDetails' });
          }}
        />
      );
    case 'euRep':
      return (
        <EuRepSection
          onNavigateToAccountDetails={() => {
            onNavigate('accountDetails', { tab: 'paymentDetails' });
          }}
        />
      );
    case 'accountDetails':
      return (
        <AccountDetailsSection tab={accountDetailsTab} onTabChange={onAccountDetailsTabChange} />
      );
  }
}

function readAccountDetailsTabFromSearchParams(searchParams: URLSearchParams): AccountDetailsTab {
  const value = searchParams.get('tab');
  return isAccountDetailsTab(value) ? value : 'profile';
}

export function AccountShell() {
  const t = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const logout = useOverlayState();
  const isLargeScreen = useIsLargeScreen();

  const section = readSectionFromUrl(searchParams);
  const accountDetailsTab = readAccountDetailsTabFromSearchParams(searchParams);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigate = useCallback(
    (next: AccountSectionId, options?: { tab?: AccountDetailsTab }) => {
      setMobileNavOpen(false);

      const params = new URLSearchParams(searchParams.toString());
      params.set('section', next);

      const nextTab = next === 'accountDetails' ? (options?.tab ?? 'profile') : undefined;
      if (nextTab && nextTab !== 'profile') {
        params.set('tab', nextTab);
      } else if (next !== 'generator') {
        params.delete('tab');
      }

      router.replace(`/account?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, searchParams]
  );

  const handleAccountDetailsTabChange = useCallback(
    (tab: AccountDetailsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'profile') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      router.replace(`/account?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  function handleLogout() {
    clearAuthToken();
    queryClient.clear();
    logout.close();
    router.push('/login');
  }

  const sidebarNav = (
    <SidebarNav
      active={section}
      onNavigate={navigate}
      onLogout={() => {
        logout.open();
      }}
    />
  );

  return (
    <>
      <RegularPage topBarVariant="account" showFooter={false} noPadding>
        <div className="border-border flex items-center justify-end gap-2 border-b px-4 py-3 sm:px-8 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen((open) => !open);
            }}
            aria-expanded={mobileNavOpen}
            aria-label={t('nav.openMenu')}
            className="border-border text-foreground flex size-11 items-center justify-center rounded-xl border"
          >
            {mobileNavOpen ? <X size={20} /> : <List size={20} />}
          </button>
          <Button
            variant="outline"
            size="md"
            className="text-danger gap-2"
            onPress={() => {
              logout.open();
            }}
          >
            <SignOut size={18} weight="bold" />
            {t('nav.logout')}
          </Button>
        </div>

        {mobileNavOpen ? (
          <div className="border-border border-b lg:hidden">
            <AccountSidebar
              active={section}
              onNavigate={navigate}
              onLogout={() => {
                setMobileNavOpen(false);
                logout.open();
              }}
            />
          </div>
        ) : null}

        <AccountLayoutProvider mode={isLargeScreen ? 'split' : 'stack'}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip lg:grid lg:grid-cols-[280px_1fr] lg:grid-rows-[auto_auto_auto_1fr]">
            <div className="border-border hidden border-r lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block">
              <SidebarUser />
            </div>

            <div className="contents min-w-0">
              <AccountSectionContent
                section={section}
                onNavigate={navigate}
                accountDetailsTab={accountDetailsTab}
                onAccountDetailsTabChange={handleAccountDetailsTabChange}
              />
            </div>

            <AccountHeaderRule className="hidden lg:col-span-2 lg:row-start-3 lg:block" />

            <aside className="border-border sticky top-24 hidden min-h-0 w-[280px] shrink-0 flex-col self-stretch border-r lg:col-start-1 lg:row-start-4 lg:flex">
              {sidebarNav}
            </aside>
          </div>
        </AccountLayoutProvider>
      </RegularPage>

      <ConfirmDialog
        state={logout}
        title={t('logout.confirmTitle')}
        body={t('logout.confirmBody')}
        confirmLabel={t('logout.confirm')}
        cancelLabel={t('logout.cancel')}
        onConfirm={handleLogout}
      />
    </>
  );
}
