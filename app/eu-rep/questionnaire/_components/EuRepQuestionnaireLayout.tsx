'use client';

import { type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NestedScreenShell } from '@/components/shared/NestedScreenShell';

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
  const tService = useTranslations('services.euRep');
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const backHref = returnTo?.startsWith('/result?') ? returnTo : '/eu-rep';

  return (
    <NestedScreenShell
      activePath="/eu-rep"
      backHref={backHref}
      backLabel={backLabel}
      preferHref={Boolean(returnTo?.startsWith('/result?'))}
      detailTitle={tService('label')}
      pageHeader={
        <>
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-foreground max-w-3xl leading-relaxed">{intro}</p>
        </>
      }
    >
      {children}
    </NestedScreenShell>
  );
}
