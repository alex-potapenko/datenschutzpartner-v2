'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useProfile } from '@/api/account';
import { clearAuthToken } from '@/lib/auth-session';
import { ACCOUNT_DETAILS_HREF, ALL_SUBSCRIPTIONS_ACCOUNT_HREF } from '@/lib/account-routes';
import {
  CaretDown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
  IdentificationCard,
  Receipt,
  SignOut,
  User,
  useOverlayState,
} from '@/components/ui';
import { ConfirmDialog } from './ConfirmDialog';
import { cn } from '@/lib/utils';

const topBarOutlineTriggerClass =
  'topbar-outline-trigger font-display button button--sm button--outline inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap border-white/20 text-white';

/**
 * Account chrome on the top bar: user icon + name opening profile, cross-website
 * subscriptions and log out. Replaces the former close button.
 */
export function AccountProfileMenu({
  onLeaveRequest,
}: {
  /** Wizard shell — any item opens the leave confirmation instead of navigating. */
  onLeaveRequest?: () => void;
} = {}) {
  const t = useTranslations('account');
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const logout = useOverlayState();

  const displayName = profile.data?.displayName ?? '';
  const firstName = profile.data?.firstName ?? displayName.split(' ')[0] ?? '';
  const label = displayName.trim() || firstName || profile.data?.email || t('nav.accountDetails');
  const buttonLabel = firstName || label;

  function handleMenuAction(action?: () => void) {
    if (onLeaveRequest) {
      onLeaveRequest();
      return;
    }
    action?.();
  }

  function handleLogout() {
    clearAuthToken();
    queryClient.clear();
    logout.close();
    router.push('/login');
  }

  return (
    <>
      <DropdownRoot>
        <DropdownTrigger
          aria-label={t('nav.profileMenu')}
          className={cn(topBarOutlineTriggerClass)}
        >
          <User size={14} weight="bold" aria-hidden />
          <span className="max-w-32 truncate">{buttonLabel}</span>
          <CaretDown size={14} aria-hidden />
        </DropdownTrigger>

        <DropdownPopover placement="bottom end" className="mt-1 w-64">
          <DropdownMenu aria-label={t('nav.profileMenu')}>
            <DropdownItem
              id="accountDetails"
              href={onLeaveRequest ? undefined : ACCOUNT_DETAILS_HREF}
              textValue={t('nav.accountDetails')}
              className="px-3 py-2.5"
              onAction={onLeaveRequest ? () => { handleMenuAction(); } : undefined}
            >
              <span className="flex items-center gap-3">
                <IdentificationCard size={18} className="text-muted shrink-0" aria-hidden />
                <span className="text-sm font-medium">{t('nav.accountDetails')}</span>
              </span>
            </DropdownItem>
            <DropdownItem
              id="allSubscriptions"
              href={onLeaveRequest ? undefined : ALL_SUBSCRIPTIONS_ACCOUNT_HREF}
              textValue={t('nav.allSubscriptions')}
              className="px-3 py-2.5"
              onAction={onLeaveRequest ? () => { handleMenuAction(); } : undefined}
            >
              <span className="flex items-center gap-3">
                <Receipt size={18} className="text-muted shrink-0" aria-hidden />
                <span className="text-sm font-medium">{t('nav.allSubscriptions')}</span>
              </span>
            </DropdownItem>
            <DropdownItem
              id="logout"
              textValue={t('nav.logout')}
              className="border-border mt-1 border-t px-3 py-2.5 pt-3"
              onAction={() => {
                handleMenuAction(() => {
                  logout.open();
                });
              }}
            >
              <span className="text-danger flex items-center gap-3">
                <SignOut size={18} className="shrink-0" aria-hidden />
                <span className="text-sm font-medium">{t('nav.logout')}</span>
              </span>
            </DropdownItem>
          </DropdownMenu>
        </DropdownPopover>
      </DropdownRoot>

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
