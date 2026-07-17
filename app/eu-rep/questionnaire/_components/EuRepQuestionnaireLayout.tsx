'use client';

import { type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { RegularPage } from '@/components/shared/RegularPage';

type EuRepQuestionnaireLayoutProps = {
  title: string;
  intro: string;
  backLabel: string;
  children: ReactNode;
};

export function EuRepQuestionnaireLayout({
  title,
  intro,
  backLabel,
  children,
}: EuRepQuestionnaireLayoutProps) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const backHref = returnTo?.startsWith('/result?') ? returnTo : '/eu-rep';

  return (
    <RegularPage
      activePath="/eu-rep"
      backLink={{
        href: backHref,
        label: backLabel,
        preferHref: Boolean(returnTo?.startsWith('/result?')),
      }}
      minimal
      showFooter={false}
      header={
        <>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-foreground max-w-3xl leading-relaxed">{intro}</p>
        </>
      }
    >
      {children}
    </RegularPage>
  );
}
