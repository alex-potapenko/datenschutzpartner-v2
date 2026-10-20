'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAffiliateProgramSettings, useRecordAffiliateVisit } from '@/api/affiliate';
import {
  AFFILIATE_CAMPAIGN_PARAM,
  AFFILIATE_REF_COOKIE,
  AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS,
  AFFILIATE_TARGET_PARAM,
  safeTargetPath,
} from '@/lib/affiliate-attribution';
import { Spinner } from '@/components/ui';

/**
 * Entry for partner links (`/ref/:slug?to=/scan&campaign=…`): records the visit, sets the
 * last-click cookie for known partners, then lands on the requested same-site page.
 */
export function AffiliateRefRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('affiliatePage.redirect');
  const settings = useAffiliateProgramSettings();
  const recordVisit = useRecordAffiliateVisit();
  const startedRef = useRef(false);

  const pathSegment = slug.trim();
  const targetPath = safeTargetPath(searchParams.get(AFFILIATE_TARGET_PARAM));
  const campaign = searchParams.get(AFFILIATE_CAMPAIGN_PARAM)?.trim() || null;
  const cookieDays = settings.data?.cookieDays;
  const settingsReady = !settings.isLoading;

  useEffect(() => {
    if (!settingsReady || startedRef.current) return;
    startedRef.current = true;
    if (!pathSegment) {
      router.replace('/');
      return;
    }
    const days = cookieDays ?? AFFILIATE_REF_COOKIE_MAX_AGE_FALLBACK_DAYS;
    recordVisit
      .mutateAsync({
        slug: pathSegment,
        targetPath,
        campaign,
        referrer: document.referrer || null,
      })
      .then((result) => {
        if (result.attributed) {
          document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(pathSegment)}; path=/; max-age=${String(days * 86400)}; samesite=lax`;
        }
        router.replace(safeTargetPath(result.targetPath) ?? '/');
      })
      .catch(() => {
        router.replace(targetPath ?? '/');
      });
  }, [settingsReady, pathSegment, targetPath, campaign, cookieDays, recordVisit, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner aria-label={t('loading')} />
    </div>
  );
}
