'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { useUpdateAffiliateSlug, type AffiliatePartner } from '@/api/affiliate';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { affiliateReferralUrl } from '@/lib/affiliate-attribution';
import {
  Button,
  Input,
  Label,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  PencilSimple,
  useOverlayState,
} from '@/components/ui';
import { AffiliateReferralCopyButton } from '../../AffiliateReferralCopyButton';

const IDENTITY_VALUE_CLASS = 'text-foreground text-base font-normal leading-snug';

const IDENTITY_VALUE_ROW_CLASS = 'flex min-w-0 items-center gap-2';

/** Compact round icon actions aligned with identity value text (sm). */
const IDENTITY_ACTION_BUTTON_CLASS = 'size-7 shrink-0 rounded-full';

function IdentityColumn({
  label,
  value,
  valueClassName,
  labelAside,
  valueAside,
  children,
  grow = false,
}: {
  label: string;
  value?: string;
  valueClassName?: string;
  labelAside?: ReactNode;
  valueAside?: ReactNode;
  children?: ReactNode;
  /** When true, column stretches in the identity row (e.g. referral URL). */
  grow?: boolean;
}) {
  return (
    <div className={grow ? 'flex min-w-0 flex-1 flex-col gap-2' : 'flex min-w-0 flex-col gap-2'}>
      <div className="flex min-w-0 items-center gap-1.5">
        <Label elementType="span">{label}</Label>
        {labelAside}
      </div>
      {children ?? (
        <div className={IDENTITY_VALUE_ROW_CLASS}>
          <p
            className={valueClassName ?? IDENTITY_VALUE_CLASS}
            aria-label={value ? `${label}: ${value}` : undefined}
          >
            {value}
          </p>
          {valueAside}
        </div>
      )}
    </div>
  );
}

function IdentityDivider() {
  return <div className="bg-border h-px shrink-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />;
}

export function AffiliatePartnerIdentityRow({
  partner,
  canEdit = true,
}: {
  partner: AffiliatePartner;
  canEdit?: boolean;
}) {
  const t = useTranslations('account.affiliate.links');
  const tDashboard = useTranslations('account.affiliate.dashboard');
  const tRoot = useTranslations();
  const updateSlug = useUpdateAffiliateSlug();
  const editSlugDialog = useOverlayState();
  const [slugDraft, setSlugDraft] = useState(partner.slug);
  const [linkCopied, setLinkCopied] = useState(false);
  const referralUrl = affiliateReferralUrl(partner.slug);

  async function copyBaseUrl() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setLinkCopied(true);
      window.setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch {
      toast.error(tDashboard('copyFailed'));
    }
  }

  function saveSlug() {
    updateSlug.mutate(
      { slug: slugDraft.trim() },
      {
        onSuccess: () => {
          toast.success(t('slugSaved'));
          editSlugDialog.close();
        },
        onError: (cause) => {
          if (cause instanceof ApiError && cause.status === 409) {
            toast.error(t('slugTaken'));
            return;
          }
          toast.error(tRoot('common.error'));
        },
      }
    );
  }

  return (
    <div
      className="flex flex-col gap-6 sm:flex-row sm:items-stretch"
      aria-label={t('identityAriaLabel')}
    >
      <IdentityColumn label={t('idTitle')}>
        <div className={IDENTITY_VALUE_ROW_CLASS}>
          <p
            className="text-foreground text-base leading-snug font-normal whitespace-nowrap tabular-nums"
            aria-label={`${t('idTitle')}: ${partner.slug}`}
          >
            {partner.slug}
          </p>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              isIconOnly
              className={IDENTITY_ACTION_BUTTON_CLASS}
              aria-label={t('slugEdit')}
              onPress={() => {
                setSlugDraft(partner.slug);
                editSlugDialog.open();
              }}
            >
              <PencilSimple size={14} weight="bold" aria-hidden />
            </Button>
          ) : null}
        </div>
      </IdentityColumn>
      <IdentityDivider />
      <IdentityColumn
        grow
        label={t('referralUrlTitle')}
        labelAside={
          <InfoTooltip label={t('referralUrlHelpLabel')}>
            {t('referralUrlDescription', { id: partner.slug })}
          </InfoTooltip>
        }
      >
        <div className={IDENTITY_VALUE_ROW_CLASS}>
          <p
            className="text-foreground min-w-0 text-base leading-snug font-normal break-all"
            aria-label={`${t('referralUrlTitle')}: ${referralUrl}`}
          >
            {referralUrl}
          </p>
          <AffiliateReferralCopyButton
            copied={linkCopied}
            copyLabel={t('copyBaseUrl')}
            copiedLabel={tDashboard('linkCopied')}
            copiedTooltip={tDashboard('linkCopiedTooltip')}
            buttonClassName={IDENTITY_ACTION_BUTTON_CLASS}
            iconSize={14}
            onCopy={() => {
              void copyBaseUrl();
            }}
          />
        </div>
      </IdentityColumn>

      <ModalRoot state={editSlugDialog}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{t('slugEditModalTitle')}</ModalHeading>
              </ModalHeader>
              <ModalBody className="pt-6">
                <Input
                  id="affiliate-slug-edit"
                  variant="secondary"
                  className="w-20 tabular-nums"
                  value={slugDraft}
                  onChange={(event) => {
                    setSlugDraft(event.target.value);
                  }}
                  aria-label={t('idTitle')}
                  maxLength={3}
                  inputMode="numeric"
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  onPress={() => {
                    setSlugDraft(partner.slug);
                    editSlugDialog.close();
                  }}
                >
                  {t('slugCancel')}
                </Button>
                <Button onPress={saveSlug} isDisabled={updateSlug.isPending}>
                  {t('slugSave')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </div>
  );
}
