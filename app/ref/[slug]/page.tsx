'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAffiliateProgramSettings } from '@/api/affiliate';
import { request } from '@/api/client';
import {
  AFFILIATE_REF_COOKIE,
  AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS,
} from '@/lib/affiliate-attribution';
import { Spinner } from '@/components/ui';

export default function AffiliateRefPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('affiliatePage.redirect');
  const settings = useAffiliateProgramSettings();
  const pathSegment = params.slug.trim();

  useEffect(() => {
    if (!pathSegment) {
      router.replace('/');
      return;
    }
    const days = settings.data?.cookieDays ?? AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS;
    let cancelled = false;
    void request('/affiliate/clicks', {
      method: 'POST',
      body: JSON.stringify({ pathSegment }),
    })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(pathSegment)}; path=/; max-age=${String(days * 86400)}; samesite=lax`;
        router.replace('/');
      });
    return () => {
      cancelled = true;
    };
  }, [pathSegment, settings.data?.cookieDays, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner aria-label={t('loading')} />
    </div>
  );
}
