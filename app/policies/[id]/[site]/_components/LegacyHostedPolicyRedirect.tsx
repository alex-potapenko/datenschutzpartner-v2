'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { request } from '@/api/client';
import { Spinner } from '@/components/ui';
import { useTranslations } from 'next-intl';

type LegacyLookup = {
  path: string;
};

export function LegacyHostedPolicyRedirect({ id, site }: { id: string; site: string }) {
  const router = useRouter();
  const t = useTranslations('policyDocument.hosted');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void request<LegacyLookup>(`/hosted-policies/legacy/${id}/${encodeURIComponent(site)}`)
      .then((result) => {
        if (!cancelled) {
          router.replace(result.path);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMissing(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, router, site]);

  if (missing) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center py-20">
      <Spinner aria-label={t('loading')} />
    </div>
  );
}
