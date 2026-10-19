'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession, useRequireSession } from '@/api/auth';
import {
  useAffiliateAdminApplications,
  useAffiliateAdminConversions,
  useApproveAffiliateApplication,
  useRejectAffiliateApplication,
} from '@/api/affiliate';
import { NestedScreenShell } from '@/components/shared/NestedScreenShell';
import { AFFILIATE_ACCOUNT_HREF } from '@/lib/account-routes';
import { Button, Spinner } from '@/components/ui';

export function AffiliateAdminApp() {
  const t = useTranslations('account.affiliateAdmin');
  const tAccount = useTranslations('account');
  const router = useRouter();
  const { isChecking } = useRequireSession();
  const session = useSession();
  const applications = useAffiliateAdminApplications();
  const conversions = useAffiliateAdminConversions();
  const approve = useApproveAffiliateApplication();
  const reject = useRejectAffiliateApplication();

  useEffect(() => {
    if (session.data && session.data.role !== 'admin') {
      router.replace(AFFILIATE_ACCOUNT_HREF);
    }
  }, [session.data, router]);

  if (isChecking || session.isLoading) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={tAccount('loading')} />
      </div>
    );
  }

  if (session.data?.role !== 'admin') {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center">
        <Spinner aria-label={tAccount('loading')} />
      </div>
    );
  }

  return (
    <NestedScreenShell
      backHref={AFFILIATE_ACCOUNT_HREF}
      backLabel={t('back')}
      detailTitle={t('title')}
      topBarVariant="account"
      activePath="/account"
      showFooter={false}
      contentClassName="max-w-3xl"
    >
      <div className="flex flex-col gap-10 py-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-foreground text-lg font-semibold">{t('applicationsTitle')}</h2>
          {applications.isLoading ? (
            <Spinner aria-label={tAccount('loading')} />
          ) : applications.data?.length === 0 ? (
            <p className="text-muted text-sm">{t('applicationsEmpty')}</p>
          ) : (
            <ul className="border-border divide-border flex flex-col divide-y rounded-2xl border">
              {applications.data?.map((row) => (
                <li key={row.id} className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-foreground font-medium">{row.email}</p>
                      <p className="text-muted text-sm">{row.websiteUrl}</p>
                    </div>
                    <span className="text-muted text-xs uppercase">{row.status}</span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">{row.description}</p>
                  {row.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        isDisabled={approve.isPending || reject.isPending}
                        onPress={() => void approve.mutateAsync(row.id)}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={approve.isPending || reject.isPending}
                        onPress={() => void reject.mutateAsync(row.id)}
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-foreground text-lg font-semibold">{t('conversionsTitle')}</h2>
          {conversions.isLoading ? (
            <Spinner aria-label={tAccount('loading')} />
          ) : conversions.data?.length === 0 ? (
            <p className="text-muted text-sm">{t('conversionsEmpty')}</p>
          ) : (
            <ul className="border-border divide-border flex flex-col divide-y rounded-2xl border text-sm">
              {conversions.data?.map((row) => (
                <li key={row.id} className="grid gap-1 px-4 py-3 sm:grid-cols-2">
                  <span className="text-foreground font-medium">
                    {row.orderNumber} · {row.partnerSlug}
                  </span>
                  <span className="text-muted sm:text-right">
                    {t('conversionAmounts', {
                      amount: row.amountChf.toFixed(2),
                      commission: row.commissionChf.toFixed(2),
                    })}
                  </span>
                  <span className="text-muted col-span-full text-xs">{row.partnerEmail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </NestedScreenShell>
  );
}
