'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useAffiliateAdminReferrals,
  useMarkAffiliateOrderPaid,
  useRejectAffiliateReferral,
  type AffiliateAdminReferral,
} from '@/api/affiliate';
import {
  AffiliateReferralStatusFilter,
  type AffiliateReferralStatusFilterValue,
} from '@/app/account/_components/AffiliateReferralStatusFilter';
import { AFFILIATE_REFERRAL_STATUS_TONE } from '@/app/account/_components/AffiliateReferralsTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusPill } from '@/components/shared/StatusPill';
import { Button, Table, useOverlayState } from '@/components/ui';
import {
  AccountSection,
  AccountTable,
  DataState,
  formatMoney,
  useDateFormatter,
} from '@/app/account/_components/account-ui';

export function AffiliateAdminReferralsPanel() {
  const t = useTranslations('account.affiliateAdmin.referrals');
  const tStatus = useTranslations('account.affiliate.dashboard.referralStatus');
  const tc = useTranslations('common');
  const formatDate = useDateFormatter();
  const [filter, setFilter] = useState<AffiliateReferralStatusFilterValue>('all');
  const referrals = useAffiliateAdminReferrals(filter === 'all' ? undefined : filter);
  const markPaid = useMarkAffiliateOrderPaid();
  const reject = useRejectAffiliateReferral();
  const rejectDialog = useOverlayState();
  const [rejectTarget, setRejectTarget] = useState<AffiliateAdminReferral | null>(null);
  const isBusy = markPaid.isPending || reject.isPending;
  const rows = referrals.data ?? [];

  function handleMarkPaid(row: AffiliateAdminReferral) {
    markPaid.mutate(row.id, {
      onSuccess: (result) => {
        toast.success(
          result.commissionEmailSentTo
            ? t('markedPaidEmail', { email: result.commissionEmailSentTo })
            : t('markedPaid')
        );
      },
      onError: () => toast.error(tc('error')),
    });
  }

  function handleReject() {
    if (!rejectTarget) return;
    reject.mutate(rejectTarget.id, {
      onSuccess: () => {
        rejectDialog.close();
        toast.success(t('rejected'));
      },
      onError: () => toast.error(tc('error')),
    });
  }

  return (
    <AccountSection title={t('title')} contentClassName="gap-4">
      <p className="text-muted text-sm leading-relaxed">{t('body')}</p>
      <AffiliateReferralStatusFilter value={filter} onChange={setFilter} />

      <DataState
        isLoading={referrals.isLoading}
        isError={referrals.isError}
        onRetry={() => void referrals.refetch()}
      >
        {rows.length === 0 ? (
          <p className="text-muted text-sm">{t('empty')}</p>
        ) : (
          <AccountTable aria-label={t('title')}>
            <Table.Header>
              <Table.Column isRowHeader>{t('colReference')}</Table.Column>
              <Table.Column>{t('colPartner')}</Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colDate')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">{t('colOrder')}</Table.Column>
              <Table.Column className="text-right whitespace-nowrap">
                {t('colCommission')}
              </Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colStatus')}</Table.Column>
              <Table.Column className="text-right">
                <span className="sr-only">{t('colActions')}</span>
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>
                    <span className="block font-mono text-sm font-semibold">{row.reference}</span>
                    <span
                      className="text-muted block max-w-56 truncate text-xs"
                      title={row.description}
                    >
                      {row.description}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs">{row.partnerSlug}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap tabular-nums">
                    {formatDate(row.createdAt)}
                  </Table.Cell>
                  <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.orderAmountChf, 'CHF')}
                  </Table.Cell>
                  <Table.Cell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.commissionChf, 'CHF')}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusPill tone={AFFILIATE_REFERRAL_STATUS_TONE[row.status]}>
                      {tStatus(row.status)}
                    </StatusPill>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      {row.status === 'pending' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="whitespace-nowrap"
                          isDisabled={isBusy}
                          onPress={() => {
                            handleMarkPaid(row);
                          }}
                        >
                          {t('markPaid')}
                        </Button>
                      ) : null}
                      {row.status === 'pending' || row.status === 'unpaid' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          isDisabled={isBusy}
                          onPress={() => {
                            setRejectTarget(row);
                            rejectDialog.open();
                          }}
                        >
                          {t('reject')}
                        </Button>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        )}
      </DataState>

      <ConfirmDialog
        state={rejectDialog}
        title={t('rejectConfirm.title')}
        body={t('rejectConfirm.body', {
          reference: rejectTarget?.reference ?? '',
          commission: formatMoney(rejectTarget?.commissionChf ?? 0, 'CHF'),
        })}
        confirmLabel={t('rejectConfirm.confirm')}
        cancelLabel={t('rejectConfirm.cancel')}
        isPending={reject.isPending}
        onConfirm={handleReject}
      />
    </AccountSection>
  );
}
