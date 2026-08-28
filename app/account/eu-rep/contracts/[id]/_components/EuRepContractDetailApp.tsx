'use client';

import { useState, type Key, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { useEuRepContract, useUpdateEuRepContract } from '@/api/eu-rep';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { MembershipPanel } from '@/app/account/_components/sections/MembershipPanel';
import {
  AccountSection,
  DataState,
  EmptyState,
  ACCOUNT_TAB_PANEL_CLASS,
} from '@/app/account/_components/account-ui';
import { Buildings, Button, MapPin, Spinner, Tabs, cn } from '@/components/ui';
import { EuRepContractFields } from '@/components/shared/EuRepContractFields';
import { EuRepRepresentativeAddress } from '@/components/shared/EuRepRepresentativeAddress';
import {
  PolicyDetailPageShell,
  PolicyDetailScreenHeader,
} from '@/components/shared/PolicyDetailLayout';
import { StatusPill, statusTone } from '@/components/shared/StatusPill';

type ContractDetailTab = 'details' | 'subscription';

function DetailSectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          color: 'var(--accent)',
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
        }}
        aria-hidden
      >
        {icon}
      </span>
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
    </div>
  );
}

export function EuRepContractDetailApp({ contractId }: { contractId: string }) {
  const t = useTranslations('account.euRep.contract');
  const ts = useTranslations('account.status');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('account');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const returnTo = `/account/eu-rep/contracts/${contractId}`;
  const { isChecking } = useRequireSession(returnTo);
  const contractQuery = useEuRepContract(contractId);
  const update = useUpdateEuRepContract();
  const [tab, setTab] = useState<ContractDetailTab>('details');
  const [legalEntityDraft, setLegalEntityDraft] = useState<string | undefined>();
  const [forwardingEmailDraft, setForwardingEmailDraft] = useState<string | undefined>();
  const [legalEntityError, setLegalEntityError] = useState<string>();
  const [forwardingEmailError, setForwardingEmailError] = useState<string>();

  const contract = contractQuery.data;
  const legalEntity = legalEntityDraft ?? contract?.legalEntity ?? '';
  const forwardingEmail = forwardingEmailDraft ?? contract?.forwardingEmail ?? '';
  const isActive = contract?.status === 'active';
  const detailTitle = tCommon('legalEntityDetails');

  function validate(): boolean {
    const entityOk = legalEntity.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardingEmail.trim());
    setLegalEntityError(entityOk ? undefined : tValidation('required'));
    setForwardingEmailError(emailOk ? undefined : tValidation('email'));
    return entityOk && emailOk;
  }

  async function handleSave() {
    if (!contract || !validate()) return;
    try {
      await update.mutateAsync({
        id: contract.id,
        input: {
          legalEntity: legalEntity.trim(),
          forwardingEmail: forwardingEmail.trim(),
        },
      });
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveFailed'));
    }
  }

  if (isChecking) {
    return (
      <PolicyDetailPageShell
        backHref={EU_REP_ACCOUNT_HREF}
        backLabel={tCommon('back')}
        detailTitle={detailTitle}
      >
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </PolicyDetailPageShell>
    );
  }

  return (
    <PolicyDetailPageShell
      backHref={EU_REP_ACCOUNT_HREF}
      backLabel={tCommon('back')}
      detailTitle={detailTitle}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DataState
          isLoading={contractQuery.isLoading}
          isError={contractQuery.isError}
          onRetry={() => {
            void contractQuery.refetch();
          }}
        >
          {contract ? (
            <>
              <PolicyDetailScreenHeader bordered={false}>
                <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
                  {contract.legalEntity || t('title')}
                </h1>
                <StatusPill tone={statusTone(contract.status)}>{ts(contract.status)}</StatusPill>
              </PolicyDetailScreenHeader>

              <Tabs
                variant="secondary"
                selectedKey={tab}
                onSelectionChange={(key: Key) => {
                  setTab(key as ContractDetailTab);
                }}
                className="flex min-h-0 w-full flex-1 flex-col gap-0"
              >
                <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
                  <Tabs.List
                    aria-label={t('tabsAriaLabel')}
                    className="!w-auto max-w-full !border-b-0"
                  >
                    <Tabs.Tab id="details" className="!h-auto !w-auto shrink-0 pb-4">
                      <span className="text-base font-medium whitespace-nowrap">
                        {t('tabs.details')}
                      </span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="subscription" className="!h-auto !w-auto shrink-0 pb-4">
                      <span className="text-base font-medium whitespace-nowrap">
                        {t('tabs.subscription')}
                      </span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>

                <Tabs.Panel
                  id="details"
                  className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
                >
                  <div className="divide-border flex min-h-0 flex-1 flex-col divide-y lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
                    <AccountSection
                      className="min-w-0 flex-1 lg:min-h-full lg:basis-0"
                      contentClassName="gap-6"
                    >
                      <DetailSectionHeader
                        icon={<Buildings size={18} weight="fill" />}
                        title={t('sectionContractDetails')}
                      />
                      <EuRepContractFields
                        idPrefix={`eu-rep-${contract.id}`}
                        legalEntity={legalEntity}
                        forwardingEmail={forwardingEmail}
                        onLegalEntityChange={setLegalEntityDraft}
                        onForwardingEmailChange={setForwardingEmailDraft}
                        legalEntityError={legalEntityError}
                        forwardingEmailError={forwardingEmailError}
                      />
                      {isActive ? (
                        <Button
                          variant="primary"
                          size="sm"
                          isDisabled={update.isPending}
                          onPress={() => {
                            void handleSave();
                          }}
                        >
                          {t('save')}
                        </Button>
                      ) : null}
                    </AccountSection>
                    <AccountSection
                      className="min-w-0 flex-1 lg:min-h-full lg:basis-0"
                      contentClassName="gap-6"
                    >
                      <DetailSectionHeader
                        icon={<MapPin size={18} weight="fill" />}
                        title={t('sectionPublishedAddress')}
                      />
                      <EuRepRepresentativeAddress hideTitle plain />
                    </AccountSection>
                  </div>
                </Tabs.Panel>

                <Tabs.Panel
                  id="subscription"
                  className={cn(ACCOUNT_TAB_PANEL_CLASS, 'flex min-h-0 flex-1 flex-col')}
                >
                  <MembershipPanel
                    productType="euRep"
                    subscriptionId={contract.subscriptionId}
                    onManagePayment={() => {
                      router.push('/account?section=accountDetails&tab=paymentDetails');
                    }}
                  />
                </Tabs.Panel>
              </Tabs>
            </>
          ) : (
            <EmptyState message={t('notFound')} />
          )}
        </DataState>
      </div>
    </PolicyDetailPageShell>
  );
}
