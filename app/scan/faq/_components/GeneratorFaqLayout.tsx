'use client';

import { type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { RegularPage } from '@/components/shared/RegularPage';

type GeneratorFaqLayoutProps = {
  title: string;
  introLead: string;
  introSupport: ReactNode;
  backLabel: string;
  children: ReactNode;
};

export function GeneratorFaqLayout({
  title,
  introLead,
  introSupport,
  backLabel,
  children,
}: GeneratorFaqLayoutProps) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const fromWizard = returnTo?.startsWith('/result?') ?? false;

  return (
    <RegularPage
      activePath="/scan"
      minimal={fromWizard}
      showFooter={!fromWizard}
      noPadding
      backLink={
        fromWizard
          ? {
              href: returnTo ?? '/scan',
              label: backLabel,
              preferHref: true,
            }
          : undefined
      }
      header={
        <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-foreground leading-relaxed">{introLead}</p>
          <p className="text-foreground leading-relaxed">{introSupport}</p>
        </div>
      }
    >
      <div className="px-4 py-10 sm:px-8 sm:py-16 lg:py-20">{children}</div>
    </RegularPage>
  );
}
