'use client';

import { useHostedPolicy } from '@/api/documents';
import { PolicyDocument } from '@/components/shared/PolicyDocument';
import { Spinner } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';

export function HostedPolicyPage({ slug }: { slug: string }) {
  const t = useTranslations('policyDocument.hosted');
  const policy = useHostedPolicy(slug);

  if (policy.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center py-20">
        <Spinner aria-label={t('loading')} />
      </div>
    );
  }

  if (policy.isError || !policy.data) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground min-h-dvh">
      <PolicyDocument document={policy.data} embedInPage className="py-8 sm:py-10" />
    </main>
  );
}
