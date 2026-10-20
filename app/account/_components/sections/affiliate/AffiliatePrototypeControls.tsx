'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAffiliatePrototypeAction, type AffiliateDashboard } from '@/api/affiliate';
import { env } from '@/env';
import { Button } from '@/components/ui';
import { AccountSection, formatMoney } from '../../account-ui';

/**
 * Stand-ins for the external admin tool and the order-paid webhook, so the partner flow can be
 * demoed end to end. Rendered only while the API is mocked.
 */
export function AffiliatePrototypeControls({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.prototypeControls');
  const action = useAffiliatePrototypeAction();

  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return null;

  const { stats, payouts, partner } = dashboard;
  const hasPending = stats.referralCounts.pending > 0;
  const hasUnpaid = stats.unpaidEarningsChf > 0;
  const hasRequested = payouts.some((row) => row.status === 'invoice_requested');
  const isActive = partner.status === 'active';

  function run(
    name: Parameters<typeof action.mutate>[0],
    message: (result: Awaited<ReturnType<typeof action.mutateAsync>>) => string
  ) {
    action.mutate(name, {
      onSuccess: (result) => toast.success(message(result)),
      onError: () => toast.error(t('failed')),
    });
  }

  return (
    <AccountSection title={t('title')} contentClassName="gap-4">
      <p className="text-muted max-w-2xl text-sm leading-relaxed">{t('body')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          isDisabled={!hasPending || action.isPending}
          onPress={() => {
            run('mark-order-paid', (result) =>
              t('orderPaidDone', {
                reference: result.reference ?? '',
                email: result.commissionEmailSentTo ?? '—',
              })
            );
          }}
        >
          {t('orderPaid')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          isDisabled={!hasUnpaid || action.isPending}
          onPress={() => {
            run('create-payout', (result) =>
              t('payoutDone', {
                amount: formatMoney(result.amountChf ?? 0, 'CHF'),
                email: result.invoiceEmailSentTo ?? '',
              })
            );
          }}
        >
          {t('payout')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          isDisabled={!hasRequested || action.isPending}
          onPress={() => {
            run('mark-transferred', () => t('transferredDone'));
          }}
        >
          {t('transferred')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          isDisabled={action.isPending}
          onPress={() => {
            run('toggle-active', (result) =>
              result.status === 'active' ? t('reactivatedDone') : t('deactivatedDone')
            );
          }}
        >
          {isActive ? t('deactivate') : t('reactivate')}
        </Button>
      </div>
    </AccountSection>
  );
}
