'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
  FlagBanner,
  Globe,
  Plus,
} from '@/components/ui';
import {
  accountLocationHref,
  addEuRepCheckoutHref,
  addWebsiteWizardHref,
} from '@/lib/account-routes';
import { cn } from '@/lib/utils';

const topBarOutlineTriggerClass =
  'topbar-outline-trigger font-display button button--sm button--outline inline-flex shrink-0 items-center justify-center whitespace-nowrap border-white/20 text-white';

export function AccountAddMenu() {
  const t = useTranslations('account.addMenu');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = accountLocationHref(pathname, searchParams);
  const addWebsiteHref = addWebsiteWizardHref(returnTo);
  const addEuRepHref = addEuRepCheckoutHref(returnTo);

  return (
    <DropdownRoot>
      <DropdownTrigger
        aria-label={t('ariaLabel')}
        className={cn(topBarOutlineTriggerClass, 'size-9 rounded-full p-0')}
      >
        <Plus size={16} weight="bold" aria-hidden />
      </DropdownTrigger>

      <DropdownPopover placement="bottom end" className="mt-1 w-64">
        <DropdownMenu aria-label={t('ariaLabel')}>
          <DropdownItem
            id="addWebsite"
            href={addWebsiteHref}
            textValue={t('addWebsite')}
            className="px-3 py-2.5"
          >
            <span className="flex items-center gap-3">
              <Globe size={18} className="text-muted shrink-0" aria-hidden />
              <span className="text-sm font-medium">{t('addWebsite')}</span>
            </span>
          </DropdownItem>
          <DropdownItem
            id="addEuRep"
            href={addEuRepHref}
            textValue={t('addEuRep')}
            className="px-3 py-2.5"
          >
            <span className="flex items-center gap-3">
              <FlagBanner size={18} className="text-muted shrink-0" aria-hidden />
              <span className="text-sm font-medium">{t('addEuRep')}</span>
            </span>
          </DropdownItem>
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  );
}
