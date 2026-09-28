'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useUpdateEuRepContract, type EuRepContract } from '@/api/eu-rep';
import { euRepEntityFieldsSchema, mapZodFieldErrors } from '@/lib/validation/fields';
import {
  EuRepContractFields,
  type EuRepPostalFields,
} from '@/components/shared/EuRepContractFields';
import { EuRepRepresentativeAddress } from '@/components/shared/EuRepRepresentativeAddress';
import { Buildings, Button, MapPin } from '@/components/ui';
import { AccountSection, EmptyState } from '../account-ui';

type PostalErrors = Partial<Record<keyof EuRepPostalFields, string>>;

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
  const [postalDraft, setPostalDraft] = useState<Partial<EuRepPostalFields>>();
  const [legalEntityError, setLegalEntityError] = useState<string>();
  const [forwardingEmailError, setForwardingEmailError] = useState<string>();
  const [postalErrors, setPostalErrors] = useState<PostalErrors>({});

  const legalEntity = legalEntityDraft ?? contract.legalEntity;
  const forwardingEmail = forwardingEmailDraft ?? contract.forwardingEmail;
  const postal: EuRepPostalFields = {
    postalDepartment: postalDraft?.postalDepartment ?? contract.postalDepartment ?? '',
    postalLine1: postalDraft?.postalLine1 ?? contract.postalLine1,
    postalLine2: postalDraft?.postalLine2 ?? contract.postalLine2 ?? '',
    postalCode: postalDraft?.postalCode ?? contract.postalCode,
    city: postalDraft?.city ?? contract.city,
    country: postalDraft?.country ?? contract.country,
  };
  const isActive = contract.status === 'active';

  function clearAddressErrors() {
    setPostalErrors((current) => {
      const next = { ...current };
      delete next.postalLine1;
      delete next.postalCode;
      delete next.city;
      return next;
    });
  }

  function validate(): boolean {
    const result = euRepEntityFieldsSchema.safeParse({
      legalEntity,
      forwardingEmail,
      postalDepartment: postal.postalDepartment ?? '',
      postalLine1: postal.postalLine1,
      postalLine2: postal.postalLine2 ?? '',
      postalCode: postal.postalCode,
      city: postal.city,
      country: postal.country,
    });

    if (!result.success) {
      const mapped = mapZodFieldErrors(result.error, (key) => tValidation(key));
      setLegalEntityError(mapped.legalEntity);
      setForwardingEmailError(mapped.forwardingEmail);
      setPostalErrors({
        postalDepartment: mapped.postalDepartment,
        postalLine1: mapped.postalLine1,
        postalLine2: mapped.postalLine2,
        postalCode: mapped.postalCode,
        city: mapped.city,
        country: mapped.country,
      });
      return false;
    }

    setLegalEntityError(undefined);
    setForwardingEmailError(undefined);
    setPostalErrors({});
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      await update.mutateAsync({
        id: contract.id,
        input: {
          legalEntity: legalEntity.trim(),
          forwardingEmail: forwardingEmail.trim(),
          postalDepartment: postal.postalDepartment?.trim() || undefined,
          postalLine1: postal.postalLine1.trim(),
          postalLine2: postal.postalLine2?.trim() || undefined,
          postalCode: postal.postalCode.trim(),
          city: postal.city.trim(),
          country: postal.country.trim(),
        },
      });
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveFailed'));
    }
  }

  return (
    <div className="divide-border flex min-h-0 flex-col divide-y lg:min-h-[calc(100dvh-var(--topbar-height,6rem))] lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
      <AccountSection
        className="min-w-0 flex-1 lg:flex lg:h-full lg:min-h-full lg:basis-0 lg:flex-col"
        contentClassName="gap-6 lg:flex lg:flex-1 lg:flex-col"
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
          onLegalEntityFocus={() => {
            setLegalEntityError(undefined);
          }}
          onForwardingEmailFocus={() => {
            setForwardingEmailError(undefined);
          }}
          onPostalFieldFocus={clearAddressErrors}
          legalEntityError={legalEntityError}
          forwardingEmailError={forwardingEmailError}
          postal={postal}
          onPostalChange={(patch) => {
            setPostalDraft((current) => ({
              postalDepartment: current?.postalDepartment ?? contract.postalDepartment ?? '',
              postalLine1: current?.postalLine1 ?? contract.postalLine1,
              postalLine2: current?.postalLine2 ?? contract.postalLine2 ?? '',
              postalCode: current?.postalCode ?? contract.postalCode,
              city: current?.city ?? contract.city,
              country: current?.country ?? contract.country,
              ...patch,
            }));
            if ('postalLine2' in patch || 'postalDepartment' in patch) {
              setPostalErrors((current) => {
                const next = { ...current };
                if ('postalLine2' in patch) delete next.postalLine2;
                if ('postalDepartment' in patch) delete next.postalDepartment;
                return next;
              });
              return;
            }
            clearAddressErrors();
          }}
          postalErrors={postalErrors}
        />
        {isActive ? (
          <Button
            variant="primary"
            size="sm"
            className="mt-auto w-fit self-start"
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
