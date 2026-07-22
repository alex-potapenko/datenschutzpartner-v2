'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useEuRepInquiries, type EuRepInquiryStatus } from '@/api/eu-rep-inquiries';
import { Tabs, Table } from '@/components/ui';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';
import {
  AccountSectionFrame,
  ACCOUNT_TAB_PANEL_CLASS,
  AccountPanel,
  AccountTable,
  DataState,
  EmptyState,
  useDateFormatter,
} from '../account-ui';
import { MembershipPanel } from './MembershipPanel';

const EU_REP_TAB_IDS = ['inquiries', 'subscription'] as const;
type EuRepTab = (typeof EU_REP_TAB_IDS)[number];

function inquiryStatusTone(status: EuRepInquiryStatus): StatusTone {
  switch (status) {
    case 'answered':
      return 'success';
    case 'forwarded':
      return 'warning';
    case 'closed':
      return 'neutral';
  }
}

function InquiriesPanel() {
  const t = useTranslations('account.euRep.inquiries');
  const inquiries = useEuRepInquiries();
  const formatDate = useDateFormatter();

  return (
    <DataState
      isLoading={inquiries.isLoading}
      isError={inquiries.isError}
      onRetry={() => void inquiries.refetch()}
    >
      {inquiries.data && inquiries.data.length === 0 ? <EmptyState message={t('empty')} /> : null}

      {inquiries.data && inquiries.data.length > 0 ? (
        <AccountPanel>
          <AccountTable aria-label={t('tableLabel')}>
            <Table.Header>
              <Table.Column isRowHeader>{t('colDate')}</Table.Column>
              <Table.Column>{t('colSubject')}</Table.Column>
              <Table.Column>{t('colStatus')}</Table.Column>
            </Table.Header>
            <Table.Body>
              {inquiries.data.map((inquiry) => (
                <Table.Row key={inquiry.id}>
                  <Table.Cell>{formatDate(inquiry.date)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-foreground font-medium">{inquiry.subject}</span>
                      {inquiry.reference ? (
                        <span className="text-muted font-mono text-xs">{inquiry.reference}</span>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusPill tone={inquiryStatusTone(inquiry.status)}>
                      {t(`status.${inquiry.status}`)}
                    </StatusPill>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </AccountTable>
        </AccountPanel>
      ) : null}
    </DataState>
  );
}

export function EuRepSection({
  onNavigateToAccountDetails,
}: {
  onNavigateToAccountDetails?: () => void;
} = {}) {
  const t = useTranslations('account.euRep');
  const [tab, setTab] = useState<EuRepTab>('inquiries');

  return (
    <AccountSectionFrame
      title={t('title')}
      tabsAriaLabel={t('tabsAriaLabel')}
      tabs={EU_REP_TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) }))}
      selectedTab={tab}
      onTabChange={(key) => {
        setTab(key as EuRepTab);
      }}
    >
      <Tabs.Panel id="inquiries" className={ACCOUNT_TAB_PANEL_CLASS}>
        <InquiriesPanel />
      </Tabs.Panel>
      <Tabs.Panel id="subscription" className={ACCOUNT_TAB_PANEL_CLASS}>
        <MembershipPanel
          productType="euRep"
          onManagePayment={() => onNavigateToAccountDetails?.()}
        />
      </Tabs.Panel>
    </AccountSectionFrame>
  );
}
