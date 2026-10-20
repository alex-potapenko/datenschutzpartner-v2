'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useAffiliateAdminPartners,
  useCreateAffiliatePayout,
  usePreviewAffiliatePayout,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import {
  Alert,
  Button,
  Input,
  ListBox,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  Select,
  Spinner,
  useOverlayState,
} from '@/components/ui';
import { previousQuarterPeriod } from '@/lib/affiliate-ledger';
import { formatMoney, useDateFormatter } from '@/app/account/_components/account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;

function PayoutForm({
  initialPartnerId,
  onDone,
}: {
  initialPartnerId: string | null;
  onDone: () => void;
}) {
  const t = useTranslations('account.affiliateAdmin.createPayout');
  const tc = useTranslations('common');
  const formatDate = useDateFormatter();
  const partners = useAffiliateAdminPartners();
  const preview = usePreviewAffiliatePayout();
  const createPayout = useCreateAffiliatePayout();
  const [defaultPeriod] = useState(() => previousQuarterPeriod(new Date()));
  const [partnerId, setPartnerId] = useState<string | null>(initialPartnerId);
  const [periodStart, setPeriodStart] = useState(defaultPeriod.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.periodEnd);
  const { mutate: requestPreview } = preview;

  const request = partnerId
    ? { partnerId, periodStart: periodStart || null, periodEnd: periodEnd || null }
    : null;

  useEffect(() => {
    if (!partnerId) return;
    requestPreview({ partnerId, periodStart: periodStart || null, periodEnd: periodEnd || null });
  }, [partnerId, periodStart, periodEnd, requestPreview]);

  const data = partnerId ? preview.data : undefined;
  const canCreate = Boolean(request && data && data.referrals.length > 0);

  function handleCreate() {
    if (!request) return;
    createPayout.mutate(request, {
      onSuccess: (payout) => {
        toast.success(
          t('created', {
            amount: formatMoney(payout.amountChf, 'CHF'),
            email: payout.invoiceEmailSentTo,
          })
        );
        onDone();
      },
      onError: () => toast.error(tc('error')),
    });
  }

  return (
    <>
      <ModalBody>
        <div className="flex flex-col gap-5">
          <p className="text-muted text-sm leading-relaxed">{t('body')}</p>
          <Field label={t('partnerLabel')} htmlFor="payout-partner">
            <Select
              value={partnerId}
              onChange={(key) => {
                if (typeof key === 'string') setPartnerId(key);
              }}
              variant="secondary"
              fullWidth
              placeholder={t('partnerPlaceholder')}
              aria-label={t('partnerLabel')}
            >
              <Select.Trigger id="payout-partner">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {(partners.data ?? []).map((partner) => (
                    <ListBox.Item key={partner.id} id={partner.id} textValue={partner.email}>
                      {partner.email}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('fromLabel')} htmlFor="payout-from">
              <Input
                id="payout-from"
                type="date"
                variant="secondary"
                fullWidth
                value={periodStart}
                onChange={(event) => {
                  setPeriodStart(event.target.value);
                }}
              />
            </Field>
            <Field label={t('toLabel')} htmlFor="payout-to">
              <Input
                id="payout-to"
                type="date"
                variant="secondary"
                fullWidth
                value={periodEnd}
                onChange={(event) => {
                  setPeriodEnd(event.target.value);
                }}
              />
            </Field>
          </div>
          <p className="text-muted -mt-3 text-xs">{t('periodHint')}</p>

          {!partnerId ? null : preview.isPending && !data ? (
            <Spinner aria-label={t('previewLoading')} />
          ) : data ? (
            <div className="flex flex-col gap-4" aria-live="polite">
              {data.referrals.length === 0 ? (
                <p className="text-muted text-sm">{t('nothingToPay')}</p>
              ) : (
                <div className="border-border flex flex-col rounded-xl border text-sm">
                  <ul className="divide-border divide-y">
                    {data.referrals.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-xs font-semibold">
                            {row.reference}
                          </span>
                          <span className="text-muted block truncate text-xs">
                            {formatDate(row.createdAt)} · {row.description}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatMoney(row.commissionChf, 'CHF')}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-3 font-semibold">
                    <span>{t('total', { count: data.referrals.length })}</span>
                    <span className="tabular-nums">{formatMoney(data.amountChf, 'CHF')}</span>
                  </div>
                </div>
              )}
              {data.referrals.length > 0 && data.belowThreshold ? (
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>
                      {t('belowThresholdTitle', {
                        threshold: data.payoutThresholdChf.toFixed(0),
                      })}
                    </Alert.Title>
                    <Alert.Description className="text-foreground text-sm">
                      {t('belowThresholdBody')}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
              {data.referrals.length > 0 ? (
                <p className="text-muted text-sm leading-relaxed">
                  {t('emailNote', { email: data.notificationEmail })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onPress={onDone}>
          {t('cancel')}
        </Button>
        <Button
          variant="primary"
          isDisabled={!canCreate || createPayout.isPending}
          onPress={handleCreate}
        >
          {t('submit')}
        </Button>
      </ModalFooter>
    </>
  );
}

/** Settles unpaid referrals for one partner and triggers the invoice-request email. */
export function AffiliateCreatePayoutDialog({
  state,
  initialPartnerId,
}: {
  state: OverlayState;
  initialPartnerId: string | null;
}) {
  const t = useTranslations('account.affiliateAdmin.createPayout');

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('title')}</ModalHeading>
            </ModalHeader>
            {state.isOpen ? (
              <PayoutForm
                key={initialPartnerId ?? 'none'}
                initialPartnerId={initialPartnerId}
                onDone={() => {
                  state.close();
                }}
              />
            ) : null}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
