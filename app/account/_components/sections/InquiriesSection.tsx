'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAccountSnapshot } from '@/api/account';
import {
  useEuRepInquiries,
  type EuRepInquiry,
  type EuRepInquiryStatus,
} from '@/api/eu-rep-inquiries';
import { Button, GlobeHemisphereEast, Plus, SearchField, Table } from '@/components/ui';
import { StatusPill, type StatusTone } from '@/components/shared/StatusPill';
import { PriceBlock } from '@/components/shared/PriceBlock';
import {
  AccountSection,
  AccountTable,
  DataState,
  EmptyState,
  useDateFormatter,
} from '../account-ui';

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

function CountWithAdd({
  addLabel,
  onAdd,
  children,
}: {
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        variant="outline"
        size="sm"
        isIconOnly
        aria-label={addLabel}
        className="size-9 shrink-0 rounded-full"
        onPress={onAdd}
      >
        <Plus size={14} weight="bold" aria-hidden />
      </Button>
    </div>
  );
}

function matchesInquirySearch(inquiry: EuRepInquiry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    inquiry.subject.toLowerCase().includes(normalized) ||
    (inquiry.reference?.toLowerCase().includes(normalized) ?? false)
  );
}

function InquiryAllowanceSection({
  included,
  used,
  furtherInquiryAmount,
  currency,
  onAdd,
  addLabel,
}: {
  included: number;
  used: number;
  furtherInquiryAmount: number;
  currency: string;
  onAdd: () => void;
  addLabel: string;
}) {
  const t = useTranslations('account.euRep.inquiries');
  const remaining = Math.max(0, included - used);
  const usedFraction = included > 0 ? Math.min(1, used / included) : 1;
  const isDepleted = remaining <= 0;

  return (
    <AccountSection
      title={t('allowanceTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <CountWithAdd addLabel={addLabel} onAdd={onAdd}>
        <PriceBlock amount={String(remaining)} animatedAmount={remaining} className="min-w-0" />
      </CountWithAdd>
      <p className="text-muted text-sm leading-snug">
        {currency} {furtherInquiryAmount.toFixed(0)} {t('furtherInquiryNote')}
      </p>
      <div
        className="bg-border h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={included}
        aria-valuenow={used}
      >
        <div
          className={isDepleted ? 'bg-danger h-full rounded-full' : 'bg-accent h-full rounded-full'}
          style={{ width: `${usedFraction * 100}%` }}
        />
      </div>
    </AccountSection>
  );
}

function InquiriesCountSection({
  count,
  onAdd,
  addLabel,
}: {
  count: number;
  onAdd: () => void;
  addLabel: string;
}) {
  const t = useTranslations('account.euRep.inquiries');

  return (
    <AccountSection
      title={t('countTitle')}
      className="min-w-0 flex-1 gap-4"
      contentClassName="gap-3"
    >
      <CountWithAdd addLabel={addLabel} onAdd={onAdd}>
        <PriceBlock amount={String(count)} animatedAmount={count} className="min-w-0" />
      </CountWithAdd>
      <p className="text-muted text-sm">{t('countNote')}</p>
    </AccountSection>
  );
}

function InquiryStatsRow({
  included,
  used,
  furtherInquiryAmount,
  currency,
  inquiryCount,
  onAdd,
  addLabel,
}: {
  included: number;
  used: number;
  furtherInquiryAmount: number;
  currency: string;
  inquiryCount: number;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="border-border divide-border flex flex-col divide-y border-b sm:flex-row sm:divide-x sm:divide-y-0">
      <InquiryAllowanceSection
        included={included}
        used={used}
        furtherInquiryAmount={furtherInquiryAmount}
        currency={currency}
        onAdd={onAdd}
        addLabel={addLabel}
      />
      <InquiriesCountSection count={inquiryCount} onAdd={onAdd} addLabel={addLabel} />
    </div>
  );
}

function InquiryTable({
  inquiries,
  searchQuery,
  emptySearch,
  tableLabel,
}: {
  inquiries: EuRepInquiry[];
  searchQuery: string;
  emptySearch: string;
  tableLabel: string;
}) {
  const t = useTranslations('account.euRep.inquiries');
  const formatDate = useDateFormatter();

  const filtered = useMemo(() => {
    return inquiries.filter((inquiry) => matchesInquirySearch(inquiry, searchQuery));
  }, [inquiries, searchQuery]);

  if (filtered.length === 0) {
    return <EmptyState message={emptySearch} />;
  }

  return (
    <AccountTable aria-label={tableLabel}>
      <Table.Header>
        <Table.Column isRowHeader>{t('colSubject')}</Table.Column>
        <Table.Column>{t('colReference')}</Table.Column>
        <Table.Column>{t('colDate')}</Table.Column>
        <Table.Column>{t('colStatus')}</Table.Column>
      </Table.Header>
      <Table.Body>
        {filtered.map((inquiry) => (
          <Table.Row key={inquiry.id}>
            <Table.Cell>
              <span className="text-foreground flex min-w-0 items-center gap-2 font-medium">
                <GlobeHemisphereEast
                  size={18}
                  weight="fill"
                  className="shrink-0"
                  style={{ color: 'var(--feature-red)' }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{inquiry.subject}</span>
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-muted font-mono text-sm">{inquiry.reference ?? '—'}</span>
            </Table.Cell>
            <Table.Cell>{formatDate(inquiry.date)}</Table.Cell>
            <Table.Cell>
              <StatusPill tone={inquiryStatusTone(inquiry.status)}>
                {t(`status.${inquiry.status}`)}
              </StatusPill>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </AccountTable>
  );
}

export function InquiriesSection() {
  const t = useTranslations('account.euRep.inquiries');
  const router = useRouter();
  const inquiries = useEuRepInquiries();
  const snapshot = useAccountSnapshot();
  const [searchQuery, setSearchQuery] = useState('');

  const inquiryAllowance = snapshot.data?.euRepInquiryAllowance;
  const goToContact = () => {
    router.push('/contact?subject=eu-representative');
  };

  return (
    <DataState
      isLoading={inquiries.isLoading || snapshot.isLoading}
      isError={inquiries.isError}
      onRetry={() => void inquiries.refetch()}
    >
      {inquiries.data ? (
        <div className="divide-border flex flex-col divide-y">
          {inquiryAllowance ? (
            <InquiryStatsRow
              included={inquiryAllowance.included}
              used={inquiryAllowance.used}
              furtherInquiryAmount={inquiryAllowance.furtherInquiryAmount}
              currency={inquiryAllowance.currency}
              inquiryCount={inquiries.data.length}
              onAdd={goToContact}
              addLabel={t('addInquiry')}
            />
          ) : null}

          <AccountSection title={t('listTitle')} contentClassName="gap-8">
            {inquiries.data.length === 0 ? (
              <EmptyState
                message={t('empty')}
                action={
                  <Button variant="primary" size="md" className="gap-2" onPress={goToContact}>
                    <Plus size={18} weight="bold" />
                    {t('emptyCta')}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
                  <div className="w-64 min-w-48 shrink-0">
                    <SearchField
                      aria-label={t('searchLabel')}
                      name="inquiry-search"
                      variant="secondary"
                      fullWidth
                      value={searchQuery}
                      onChange={setSearchQuery}
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder={t('searchPlaceholder')} />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto shrink-0 gap-2"
                    onPress={goToContact}
                  >
                    <Plus size={14} weight="bold" />
                    {t('addInquiry')}
                  </Button>
                </div>

                <InquiryTable
                  inquiries={inquiries.data}
                  searchQuery={searchQuery}
                  emptySearch={t('emptySearch')}
                  tableLabel={t('listTitle')}
                />
              </>
            )}
          </AccountSection>
        </div>
      ) : null}
    </DataState>
  );
}
