'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  affiliateCommissionRateFormSchema,
  useAffiliateAdminPartner,
  useSetAffiliatePartnerActive,
  useUpdateAffiliatePartnerRate,
  type AffiliateCommissionRateForm,
  type AffiliateDashboard,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import {
  Button,
  CheckCircle,
  CurrencyDollar,
  CursorClick,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHeader,
  DrawerHeading,
  DrawerRoot,
  Input,
  useOverlayState,
} from '@/components/ui';
import { AffiliatePartnerStatsRow } from '@/app/account/_components/AffiliatePartnerStatsRow';
import { AffiliatePartnerStatusPill } from '@/app/account/_components/AffiliatePartnerStatusPill';
import { AffiliatePayoutStatusPill } from '@/app/account/_components/AffiliatePayoutStatusPill';
import { AffiliateReferralsTable } from '@/app/account/_components/AffiliateReferralsTable';
import { DataState, formatMoney, useDateFormatter } from '@/app/account/_components/account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;

const LATEST_REFERRALS = 10;

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-4 border-t px-6 py-6 first:border-t-0">
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function CommissionRateForm({ partnerId, rate }: { partnerId: string; rate: number }) {
  const t = useTranslations('account.affiliateAdmin.partnerDetail');
  const tRoot = useTranslations();
  const update = useUpdateAffiliatePartnerRate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AffiliateCommissionRateForm>({
    resolver: zodResolver(affiliateCommissionRateFormSchema),
    values: { percent: Math.round(rate * 1000) / 10 },
  });

  function onSubmit({ percent }: AffiliateCommissionRateForm) {
    update.mutate(
      { id: partnerId, commissionRate: percent / 100 },
      {
        onSuccess: (saved) => {
          toast.success(t('rateSaved'));
          reset({ percent: Math.round(saved.commissionRate * 1000) / 10 });
        },
        onError: () => {
          toast.error(t('rateFailed'));
        },
      }
    );
  }

  const error = errors.percent?.message;

  return (
    <form
      className="flex flex-col gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)();
      }}
    >
      <Field
        label={t('rateLabel')}
        htmlFor="affiliate-partner-rate"
        hint={t('rateHint')}
        hintClassName="text-muted"
      >
        <div className="flex items-center gap-3">
          <div className="flex w-32 items-center gap-2">
            <Input
              id="affiliate-partner-rate"
              type="number"
              inputMode="decimal"
              step="0.5"
              variant="secondary"
              fullWidth
              aria-invalid={Boolean(error)}
              {...register('percent', { valueAsNumber: true })}
            />
            <span className="text-muted text-sm">%</span>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={!isDirty || update.isPending}
          >
            {t('rateSave')}
          </Button>
        </div>
        <FieldErrorText message={error ? tRoot(error) : undefined} />
      </Field>
    </form>
  );
}

function PartnerDetail({ detail }: { detail: AffiliateDashboard }) {
  const t = useTranslations('account.affiliateAdmin.partnerDetail');
  const tReferrals = useTranslations('account.affiliate.dashboard');
  const formatDate = useDateFormatter();
  const { partner, stats, referralLinks, referrals, payouts } = detail;

  return (
    <>
      <DrawerSection title={t('statsTitle')}>
        <AffiliatePartnerStatsRow
          items={[
            {
              key: 'visits',
              icon: <CursorClick size={18} weight="fill" />,
              label: t('visits'),
              value: stats.visits,
              format: 'count',
            },
            {
              key: 'unpaid',
              icon: <CurrencyDollar size={18} weight="fill" />,
              label: t('unpaid'),
              value: stats.unpaidEarningsChf,
              format: 'chf',
            },
            {
              key: 'paid',
              icon: <CheckCircle size={18} weight="fill" />,
              label: t('paid'),
              value: stats.paidEarningsChf,
              format: 'chf',
            },
          ]}
        />
      </DrawerSection>

      <DrawerSection title={t('rateTitle')}>
        <CommissionRateForm partnerId={partner.id} rate={partner.commissionRate} />
      </DrawerSection>

      <DrawerSection title={t('linksTitle')}>
        {referralLinks.length === 0 ? (
          <p className="text-muted text-sm">{t('linksEmpty')}</p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {referralLinks.map((link) => (
              <li key={link.id} className="flex items-start justify-between gap-4 py-2.5">
                <span className="min-w-0">
                  <span className="text-foreground block truncate font-mono text-sm">
                    {link.referralUrl}
                  </span>
                  {link.campaign ? (
                    <span className="text-muted block text-xs">
                      {t('linkCampaign', { campaign: link.campaign })}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted shrink-0 text-right text-xs tabular-nums">
                  {t('linkStats', { clicks: link.clicks, conversions: link.conversions })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title={t('referralsTitle', { count: referrals.length })}>
        {referrals.length === 0 ? (
          <p className="text-muted text-sm">{tReferrals('referralsEmpty')}</p>
        ) : (
          <AffiliateReferralsTable
            referrals={referrals.slice(0, LATEST_REFERRALS)}
            ariaLabel={t('referralsTitle', { count: referrals.length })}
          />
        )}
      </DrawerSection>

      <DrawerSection title={t('payoutsTitle')}>
        {payouts.length === 0 ? (
          <p className="text-muted text-sm">{t('payoutsEmpty')}</p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-foreground text-sm tabular-nums">
                  {formatDate(payout.createdAt)}
                </span>
                <span className="flex items-center gap-3">
                  <AffiliatePayoutStatusPill status={payout.status} />
                  <span className="text-foreground text-sm font-medium tabular-nums">
                    {formatMoney(payout.amountChf, 'CHF')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
    </>
  );
}

export function AffiliateAdminPartnerDrawer({
  state,
  partnerId,
}: {
  state: OverlayState;
  partnerId: string | null;
}) {
  const t = useTranslations('account.affiliateAdmin.partnerDetail');
  const tc = useTranslations('common');
  const formatDate = useDateFormatter();
  const detail = useAffiliateAdminPartner(state.isOpen ? partnerId : null);
  const setActive = useSetAffiliatePartnerActive();
  const confirmDeactivate = useOverlayState();
  const partner = detail.data?.partner;

  function changeStatus(active: boolean) {
    if (!partner) return;
    setActive.mutate(
      { id: partner.id, active },
      {
        onSuccess: () => {
          confirmDeactivate.close();
          toast.success(active ? t('reactivated') : t('deactivated'));
        },
        onError: () => {
          toast.error(t('statusFailed'));
        },
      }
    );
  }

  return (
    <>
      <DrawerRoot state={state}>
        <DrawerBackdrop isDismissable>
          <DrawerContent placement="right">
            <DrawerDialog className="bg-background text-foreground flex h-full w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
              <DrawerCloseTrigger aria-label={tc('close')} />
              <DrawerHeader className="border-border flex flex-col gap-1.5 border-b px-6 py-5">
                <DrawerHeading className="text-lg font-semibold">
                  {partner?.email ?? t('title')}
                </DrawerHeading>
                {partner ? (
                  <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-mono">{partner.slug}</span>
                    <AffiliatePartnerStatusPill status={partner.status} />
                    <span>
                      {partner.deactivatedAt
                        ? t('deactivatedOn', { date: formatDate(partner.deactivatedAt) })
                        : t('since', { date: formatDate(partner.approvedAt) })}
                    </span>
                  </div>
                ) : null}
              </DrawerHeader>
              <DrawerBody className="!m-0 min-h-0 flex-1 overflow-y-auto !p-0">
                <DataState
                  isLoading={detail.isLoading}
                  isError={detail.isError}
                  onRetry={() => void detail.refetch()}
                >
                  {detail.data ? <PartnerDetail detail={detail.data} /> : null}
                </DataState>
              </DrawerBody>
              {partner ? (
                <DrawerFooter className="border-border flex items-center justify-between gap-4 border-t px-6 py-4">
                  <p className="text-muted text-xs leading-snug">
                    {partner.status === 'active' ? t('deactivateHint') : t('reactivateHint')}
                  </p>
                  {partner.status === 'active' ? (
                    <Button
                      variant="danger-soft"
                      size="sm"
                      onPress={() => {
                        confirmDeactivate.open();
                      }}
                    >
                      {t('deactivate')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      isDisabled={setActive.isPending}
                      onPress={() => {
                        changeStatus(true);
                      }}
                    >
                      {t('reactivate')}
                    </Button>
                  )}
                </DrawerFooter>
              ) : null}
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </DrawerRoot>
      <ConfirmDialog
        state={confirmDeactivate}
        title={t('deactivateConfirmTitle')}
        body={t('deactivateConfirmBody', { email: partner?.email ?? '' })}
        confirmLabel={t('deactivate')}
        cancelLabel={tc('cancel')}
        isPending={setActive.isPending}
        onConfirm={() => {
          changeStatus(false);
        }}
      />
    </>
  );
}
