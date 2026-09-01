'use client';

import { useTranslations } from 'next-intl';
import {
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
  FileText,
  GlobeHemisphereEast,
  Plus,
} from '@/components/ui';
import { cn } from '@/lib/utils';

const ADD_WEBSITE_HREF = '/scan';
const ADD_EU_REP_HREF = '/account/eu-rep/checkout';

const topBarOutlineTriggerClass =
  'font-display button button--sm button--outline inline-flex shrink-0 items-center justify-center whitespace-nowrap border-white/20 text-white hover:bg-white/10';

export function AccountAddMenu() {
  const t = useTranslations('account.addMenu');

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
            href={ADD_WEBSITE_HREF}
            textValue={t('addWebsite')}
            className="px-3 py-2.5"
          >
            <span className="flex items-center gap-3">
              <FileText size={18} className="text-muted shrink-0" aria-hidden />
              <span className="text-sm font-medium">{t('addWebsite')}</span>
            </span>
          </DropdownItem>
          <DropdownItem
            id="addEuRep"
            href={ADD_EU_REP_HREF}
            textValue={t('addEuRep')}
            className="px-3 py-2.5"
          >
            <span className="flex items-center gap-3">
              <GlobeHemisphereEast size={18} className="text-muted shrink-0" aria-hidden />
              <span className="text-sm font-medium">{t('addEuRep')}</span>
            </span>
          </DropdownItem>
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  );
}
