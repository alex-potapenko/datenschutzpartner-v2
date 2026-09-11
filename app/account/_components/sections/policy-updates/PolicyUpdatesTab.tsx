'use client';

import { type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { GeneratedDocument } from '@/api/documents';
import {
  usePolicyMaintenance,
  type PolicyBasicInformation,
  type PolicyMaintenanceState,
} from '@/api/policy-updates';
import { ArrowsClockwise, Clock, FileText, CaretRight, Button, Chip } from '@/components/ui';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { priceBlockAmountClassName } from '@/components/shared/PriceBlock';
import { AccountSection, DataState, useDateFormatter } from '../../account-ui';
import { PolicyServicesSection } from './PolicyServicesSection';
import {
  accountLocationHref,
  policyBasicInformationHref,
  policyManualScanHref,
} from '@/lib/account-routes';

const STATUS_BLOCK_ICON_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
};

function StatusBlock({
  icon,
  title,
  children,
  gap = 'gap-3',
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  gap?: 'gap-2' | 'gap-3';
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col ${gap}`}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={STATUS_BLOCK_ICON_STYLE}
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function BlockDivider() {
  return <div className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />;
}

function PolicyStatusSection({ state }: { state: PolicyMaintenanceState }) {
  const t = useTranslations('account.policyUpdates');
  const formatDate = useDateFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const exhausted = state.manualScansRemaining === 0;

  return (
    <AccountSection title={t('status.title')} contentClassName="gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <StatusBlock icon={<FileText size={18} weight="fill" />} title={t('status.created')}>
          <p className={priceBlockAmountClassName('sm')}>{formatDate(state.createdDate)}</p>
        </StatusBlock>

        <BlockDivider />

        <StatusBlock icon={<Clock size={18} weight="fill" />} title={t('status.lastUpdated')}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={priceBlockAmountClassName('sm')}>{formatDate(state.updatedDate)}</p>
            {state.lastUpdateSource === 'automaticScan' ? (
              <Chip variant="secondary" size="sm" color="default" className="w-fit">
                {t('status.updateAutomatic')}
              </Chip>
            ) : null}
            {state.lastUpdateSource === 'manualScan' ? (
              <Chip variant="secondary" size="sm" color="default" className="w-fit">
                {t('status.updateManual')}
              </Chip>
            ) : null}
          </div>
        </StatusBlock>

        <BlockDivider />

        <StatusBlock
          gap="gap-2"
          icon={<ArrowsClockwise size={16} weight="bold" />}
          title={t('manual.title')}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="w-fit gap-2"
                isDisabled={exhausted}
                onPress={() => {
                  router.push(
                    policyManualScanHref(
                      state.documentId,
                      accountLocationHref(pathname, searchParams)
                    )
                  );
                }}
              >
                {t('manual.cta')}
                <CaretRight size={14} weight="bold" aria-hidden />
              </Button>
              <p className="text-muted text-sm">
                {t('manual.remaining', {
                  remaining: state.manualScansRemaining,
                  total: state.settings.manualScanLimit,
                })}
              </p>
            </div>
            {exhausted && state.manualScanWindowResetDate ? (
              <p className="text-muted text-sm">
                {t('manual.resets', { date: formatDate(state.manualScanWindowResetDate) })}
              </p>
            ) : null}
          </div>
        </StatusBlock>
      </div>
    </AccountSection>
  );
}

function BasicInfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="text-foreground min-w-0 text-sm font-normal">{children}</dd>
    </div>
  );
}

function formatAddress(basic: PolicyBasicInformation): string {
  const lines = [
    basic.street,
    basic.streetLine2,
    [basic.postalCode, basic.city].filter(Boolean).join(' '),
    basic.country,
  ].filter((line) => line.trim() !== '');
  return lines.join(', ');
}

function BasicInformationSection({ state }: { state: PolicyMaintenanceState }) {
  const t = useTranslations('account.policyUpdates');
  const tq = useTranslations('result.questionnaireStep');
  const tAnswers = useTranslations('euRepQuestionnaire');
  const tAddress = useTranslations('common.address');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basic = state.basicInformation;

  function answer(value: string): ReactNode {
    if (value === 'yes') {
      return (
        <Chip variant="secondary" size="sm" color="success" className="w-fit">
          {tAnswers('yes')}
        </Chip>
      );
    }
    if (value === 'no') {
      return (
        <Chip variant="secondary" size="sm" color="default" className="w-fit">
          {tAnswers('no')}
        </Chip>
      );
    }
    if (value === 'dontknow') {
      return tAnswers('dontknow');
    }
    return t('basic.notSet');
  }
  const orDash = (value: string) => (value.trim() === '' ? t('basic.notSet') : value);

  return (
    <AccountSection
      title={t('basic.title')}
      titleAside={<InfoTooltip label={t('basic.title')}>{t('basic.body')}</InfoTooltip>}
      action={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onPress={() => {
            router.push(
              policyBasicInformationHref(
                state.documentId,
                accountLocationHref(pathname, searchParams)
              )
            );
          }}
        >
          {t('basic.edit')}
          <CaretRight size={14} weight="bold" aria-hidden />
        </Button>
      }
      contentClassName="gap-4"
    >
      <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <BasicInfoField label={tq('fields.companyName')}>
          {orDash(basic.companyName)}
        </BasicInfoField>
        <BasicInfoField label={tAddress('department')}>{orDash(basic.department)}</BasicInfoField>
        <BasicInfoField label={tq('fields.address')}>{orDash(formatAddress(basic))}</BasicInfoField>
        <BasicInfoField label={tq('fields.email')}>{orDash(basic.email)}</BasicInfoField>
        <BasicInfoField label={t('basic.dpoSection')}>
          {basic.hasDpo === 'yes' ? orDash(basic.dpoCompanyName) : answer(basic.hasDpo)}
        </BasicInfoField>
        <BasicInfoField label={t('basic.gdpr')}>{answer(basic.gdprApplicable)}</BasicInfoField>
        <BasicInfoField label={t('basic.transfersAbroad')}>
          {basic.transfersAbroad
            ? tq(`options.transfersAbroad.${basic.transfersAbroad}`)
            : t('basic.notSet')}
        </BasicInfoField>
        <BasicInfoField label={t('basic.profiling')}>{answer(basic.usesProfiling)}</BasicInfoField>
        <BasicInfoField label={t('basic.specialData')}>
          {answer(basic.processesSpecialData)}
        </BasicInfoField>
        <BasicInfoField label={t('basic.ai')}>{answer(basic.usesAiProcessing)}</BasicInfoField>
        <BasicInfoField label={t('basic.applications')}>
          {answer(basic.acceptsApplications)}
        </BasicInfoField>
        <BasicInfoField label={t('basic.videoSurveillance')}>
          {answer(basic.usesVideoSurveillance)}
        </BasicInfoField>
      </dl>
    </AccountSection>
  );
}

export function PolicyUpdatesTab({ document }: { document: GeneratedDocument }) {
  const maintenance = usePolicyMaintenance(document.id);

  return (
    <DataState
      isLoading={maintenance.isLoading}
      isError={maintenance.isError}
      onRetry={() => {
        void maintenance.refetch();
      }}
    >
      {maintenance.data ? (
        <div className="divide-border flex flex-col divide-y">
          <PolicyStatusSection state={maintenance.data} />
          <BasicInformationSection state={maintenance.data} />
          <PolicyServicesSection state={maintenance.data} />
        </div>
      ) : null}
    </DataState>
  );
}
