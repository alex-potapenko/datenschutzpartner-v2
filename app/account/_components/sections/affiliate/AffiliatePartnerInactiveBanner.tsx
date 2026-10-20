'use client';

import { useTranslations } from 'next-intl';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { Warning } from '@/components/ui';

/** Deactivated notice on Overview — full width of the tab content, directly under the page title. */
export function AffiliatePartnerInactiveBanner() {
  const t = useTranslations('account.affiliate.overview');

  return (
    <div
      className="border-border bg-warning-soft w-full border-b px-4 py-6 sm:px-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Warning
          size={20}
          weight="fill"
          className="text-warning-soft-foreground mt-0.5 shrink-0"
          aria-hidden
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-display text-warning-soft-foreground text-sm font-semibold">
            {t('inactiveTitle')}
          </p>
          <p className="text-foreground text-sm leading-relaxed">
            {t.rich('inactiveBody', {
              contact: (chunks) => (
                <NavigationLink
                  href="/contact"
                  size="sm"
                  chevron="none"
                  className="inline font-normal"
                >
                  {chunks}
                </NavigationLink>
              ),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
