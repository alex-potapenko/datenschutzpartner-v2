'use client';

import { useTranslations } from 'next-intl';

/** 32px below the pill — absolute, so it does not affect layout. */
export function ScanningCaption() {
  const t = useTranslations('result.scanStep');

  return (
    <p className="text-muted pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 translate-y-[72px] text-sm whitespace-nowrap">
      {t('scanningWebsite')}
    </p>
  );
}
