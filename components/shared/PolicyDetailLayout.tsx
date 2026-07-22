'use client';

import type { ReactNode } from 'react';
import { RegularPage } from '@/components/shared/RegularPage';

/** Shared shell for hosted policy detail — account route and post-purchase view. */
export function PolicyDetailPageShell({
  backHref,
  backLabel,
  header,
  children,
}: {
  backHref: string;
  backLabel: string;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <RegularPage
      showFooter={false}
      noPadding
      minimal
      backLink={{ href: backHref, label: backLabel, preferHref: true }}
      header={header}
    >
      {children}
    </RegularPage>
  );
}
