'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  resolvePolicySiteCount,
  subscriptionTermEndDate,
  type Order,
  type Subscription,
} from '@/api/billing';
import { calculateAmountInclVat, resolveEuRepPlan } from '@/api/checkout';
import {
  Button,
  CheckCircle,
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
import { formatMoney, useDateFormatter } from './account-ui';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="text-foreground text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Shown on the subscription tab after returning from a paid Payrexx renewal. */
export function SubscriptionRenewedDialog({
  subscription,
  order,
  onClose,
}: {
  subscription: Subscription | null;
  order: Order | undefined;
  onClose: () => void;
}) {
  const t = useTranslations('account.membershipPanel.renewedDialog');
  const tServices = useTranslations('account.dashboard.recentPayments.services');
  const tEuRepPlans = useTranslations('euRepPage.plans');
  const formatDate = useDateFormatter();
  const state = useOverlayState({
    isOpen: Boolean(subscription),
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  const termEnd = subscription ? subscriptionTermEndDate(subscription) : null;

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('title')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              {subscription ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      size={24}
                      weight="fill"
                      className="text-success mt-0.5 shrink-0"
                      aria-hidden
                    />
                    <p className="text-foreground text-sm leading-relaxed">{t('body')}</p>
                  </div>
                  <dl className="border-border divide-border flex flex-col divide-y border-y">
                    <DetailRow label={t('product')}>
                      {tServices(subscription.productType)}
                    </DetailRow>
                    {subscription.productType === 'euRep' ? (
                      <DetailRow label={t('plan')}>
                        {tEuRepPlans(`${resolveEuRepPlan(subscription.planId).id}.name`)}
                      </DetailRow>
                    ) : (
                      <DetailRow label={t('websites')}>
                        {resolvePolicySiteCount(subscription)}
                      </DetailRow>
                    )}
                    {order ? (
                      <>
                        <DetailRow label={t('amountPaid')}>
                          {formatMoney(calculateAmountInclVat(order.total), order.currency)}
                        </DetailRow>
                        <DetailRow label={t('invoice')}>{order.number}</DetailRow>
                        <DetailRow label={t('paidOn')}>{formatDate(order.date)}</DetailRow>
                      </>
                    ) : null}
                    {termEnd ? (
                      <DetailRow label={t('term')}>
                        {t('termRange', {
                          start: formatDate(subscription.startDate),
                          end: formatDate(termEnd),
                        })}
                      </DetailRow>
                    ) : null}
                    {subscription.nextPaymentDate ? (
                      <DetailRow label={t('nextRenewal')}>
                        {formatDate(subscription.nextPaymentDate)}
                      </DetailRow>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" onPress={onClose}>
                {t('done')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
