'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useUpdateEuRepContract, type EuRepContract } from '@/api/eu-rep';
import { EuRepContractFields } from '@/components/shared/EuRepContractFields';
import { EuRepRepresentativeAddress } from '@/components/shared/EuRepRepresentativeAddress';
import { Buildings, Button, MapPin } from '@/components/ui';
import { AccountSection, EmptyState } from '../account-ui';

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

export function EuRepLegalEntityPanel({ contract }: { contract?: EuRepContract }) {
  if (!contract) {
    return <EuRepLegalEntityPanelEmpty />;
  }

  return <EuRepLegalEntityPanelContent contract={contract} />;
}

function EuRepLegalEntityPanelEmpty() {
  const t = useTranslations('account.euRep.contract');
  return <EmptyState message={t('listEmpty')} />;
}

function EuRepLegalEntityPanelContent({ contract }: { contract: EuRepContract }) {
  const t = useTranslations('account.euRep.contract');
  const tValidation = useTranslations('validation');
  const update = useUpdateEuRepContract();
  const [legalEntityDraft, setLegalEntityDraft] = useState<string | undefined>();
  const [forwardingEmailDraft, setForwardingEmailDraft] = useState<string | undefined>();
  const [legalEntityError, setLegalEntityError] = useState<string>();
  const [forwardingEmailError, setForwardingEmailError] = useState<string>();

  const legalEntity = legalEntityDraft ?? contract.legalEntity;
  const forwardingEmail = forwardingEmailDraft ?? contract.forwardingEmail;
  const isActive = contract.status === 'active';

  function validate(): boolean {
    const entityOk = legalEntity.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardingEmail.trim());
    setLegalEntityError(entityOk ? undefined : tValidation('required'));
    setForwardingEmailError(emailOk ? undefined : tValidation('email'));
    return entityOk && emailOk;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      await update.mutateAsync({
        id: contract.id,
        input: {
          legalEntity: legalEntity.trim(),
          forwardingEmail: forwardingEmail.trim(),
          postalLine1: contract.postalLine1,
          postalLine2: contract.postalLine2,
          postalCode: contract.postalCode,
          city: contract.city,
          country: contract.country,
        },
      });
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveFailed'));
    }
  }

  return (
    <div className="divide-border flex min-h-0 flex-col divide-y lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
      <AccountSection className="min-w-0 flex-1 lg:min-h-full lg:basis-0" contentClassName="gap-6">
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
          fields="both"
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

      <AccountSection className="min-w-0 flex-1 lg:min-h-full lg:basis-0" contentClassName="gap-6">
        <DetailSectionHeader
          icon={<MapPin size={18} weight="fill" />}
          title={t('sectionPublishedAddress')}
        />
        <EuRepRepresentativeAddress hideTitle plain />
      </AccountSection>
    </div>
  );
}
