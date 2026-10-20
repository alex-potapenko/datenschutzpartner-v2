'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAffiliatePrototypeAction, type AffiliateDashboard } from '@/api/affiliate';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { env } from '@/env';
import {
  Button,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  useOverlayState,
} from '@/components/ui';
import { formatMoney } from '../../account-ui';

function AffiliatePrototypeDebugDialog({
  dashboard,
  state,
}: {
  dashboard: AffiliateDashboard;
  state: ReturnType<typeof useOverlayState>;
}) {
  const t = useTranslations('account.affiliate.prototypeControls');
  const tc = useTranslations('common');
  const action = useAffiliatePrototypeAction();

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
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('title')}</ModalHeading>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4 pt-6">
              <p className="text-foreground text-sm leading-relaxed">{t('body')}</p>
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
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {tc('close')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

/**
 * Mock-only affiliate lifecycle shortcuts — opened from “Show dev controls” at the bottom of Overview.
 */
export function AffiliatePrototypeControls({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.prototypeControls');
  const debugDialog = useOverlayState();

  if (env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return null;
  }

  return (
    <>
      <div className="flex justify-center px-8 pt-4 pb-8">
        <NavigationLink
          size="sm"
          chevron="none"
          onPress={() => {
            debugDialog.open();
          }}
        >
          {t('showDevControls')}
        </NavigationLink>
      </div>
      <AffiliatePrototypeDebugDialog dashboard={dashboard} state={debugDialog} />
    </>
  );
}
