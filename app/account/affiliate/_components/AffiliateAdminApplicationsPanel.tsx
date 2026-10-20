'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useAffiliateAdminApplications,
  useApproveAffiliateApplication,
  useRejectAffiliateApplication,
  type AffiliateApplication,
} from '@/api/affiliate';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';
import { Button, Table } from '@/components/ui';
import {
  AccountSection,
  AccountTable,
  DataState,
  useDateFormatter,
} from '@/app/account/_components/account-ui';

const APPLICATION_STATUS_TONE: Record<AffiliateApplication['status'], StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export function AffiliateAdminApplicationsPanel() {
  const t = useTranslations('account.affiliateAdmin.applications');
  const tc = useTranslations('common');
  const formatDate = useDateFormatter();
  const applications = useAffiliateAdminApplications();
  const approve = useApproveAffiliateApplication();
  const reject = useRejectAffiliateApplication();
  const isBusy = approve.isPending || reject.isPending;
  const rows = applications.data ?? [];

  return (
    <DataState
      isLoading={applications.isLoading}
      isError={applications.isError}
      onRetry={() => void applications.refetch()}
    >
      <AccountSection title={t('title')} contentClassName="gap-4">
        {rows.length === 0 ? (
          <p className="text-muted text-sm">{t('empty')}</p>
        ) : (
          <AccountTable aria-label={t('title')}>
            <Table.Header>
              <Table.Column isRowHeader>{t('colApplicant')}</Table.Column>
              <Table.Column>{t('colMessage')}</Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colDate')}</Table.Column>
              <Table.Column className="whitespace-nowrap">{t('colStatus')}</Table.Column>
              <Table.Column className="text-right">
                <span className="sr-only">{t('colActions')}</span>
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>
                    <span className="text-foreground block font-medium">{row.email}</span>
                    <span className="text-muted block text-xs">{row.websiteUrl}</span>
                  </Table.Cell>
                  <Table.Cell className="text-muted max-w-80 text-sm leading-relaxed">
                    {row.description || '—'}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap tabular-nums">
                    {formatDate(row.createdAt)}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusPill tone={APPLICATION_STATUS_TONE[row.status]}>
                      {t(`status.${row.status}`)}
                    </StatusPill>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {row.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          isDisabled={isBusy}
                          onPress={() => {
                            approve.mutate(row.id, {
                              onSuccess: () => toast.success(t('approved', { email: row.email })),
                              onError: () => toast.error(tc('error')),
                            });
                          }}
                        >
                          {t('approve')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          isDisabled={isBusy}
                          onPress={() => {
                            reject.mutate(row.id, {
                              onError: () => toast.error(tc('error')),
                            });
                          }}
                        >
                          {t('reject')}
                        </Button>
                      </div>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        )}
      </AccountSection>
    </DataState>
  );
}
