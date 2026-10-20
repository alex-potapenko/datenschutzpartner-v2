'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  isAffiliatePartnerEditable,
  useDeleteAffiliateVoucher,
  type AffiliateDashboard,
} from '@/api/affiliate';
import { Button, CalendarBlank, Plus, SealPercent } from '@/components/ui';
import { AffiliateVoucherDraftRow } from '../../AffiliateVoucherDraftRow';
import { AffiliateVoucherRow } from '../../AffiliateVoucherRow';
import { AccountSection, useDateFormatter } from '../../account-ui';
import { useAffiliateDraftScrollIntoView } from '../../useAffiliateDraftScrollIntoView';

const META_ICON_SIZE = 16;
const META_ICON_WEIGHT = 'regular' as const;
const ROW_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const };

export function AffiliateVouchersPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.vouchers');
  const reduceMotion = useReducedMotion();
  const formatDate = useDateFormatter();
  const deleteVoucher = useDeleteAffiliateVoucher();
  const listAriaLabel = t('listTitle');
  const [isDrafting, setIsDrafting] = useState(false);
  const { draftRef, onDraftAnimationComplete } = useAffiliateDraftScrollIntoView(
    isDrafting,
    reduceMotion
  );
  const { partner, vouchers } = dashboard;
  const canEdit = isAffiliatePartnerEditable(partner);

  function voucherMeta(voucher: (typeof vouchers)[number]) {
    const iconProps = { size: META_ICON_SIZE, weight: META_ICON_WEIGHT, 'aria-hidden': true };
    return [
      {
        key: 'created',
        icon: <CalendarBlank {...iconProps} />,
        label: t('colCreated'),
        value: formatDate(voucher.createdAt),
      },
      {
        key: 'discount',
        icon: <SealPercent {...iconProps} />,
        label: t('colDiscount'),
        value: `${voucher.discountPercent}%`,
      },
    ] as const;
  }

  const showListBox = vouchers.length > 0 || (canEdit && isDrafting);

  return (
    <AccountSection contentClassName="gap-6">
      <p className="text-foreground text-sm leading-relaxed">{t('createBody')}</p>
      <div className="flex min-w-0 flex-col gap-4" aria-label={listAriaLabel}>
        <AnimatePresence initial={false}>
          {showListBox ? (
            <div className="border-border flex flex-col overflow-visible rounded-xl border">
              <AnimatePresence initial={false} mode="popLayout">
                {vouchers.map((voucher) => (
                  <motion.div
                    key={voucher.id}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={ROW_TRANSITION}
                    className="border-border overflow-visible border-t first:border-t-0"
                  >
                    <AffiliateVoucherRow
                      id={voucher.id}
                      code={voucher.code}
                      meta={voucherMeta(voucher)}
                      isDeleting={deleteVoucher.isPending}
                      onDelete={
                        canEdit
                          ? () => {
                              void deleteVoucher.mutateAsync(voucher.id).catch(() => {
                                toast.error(t('voucherDeleteFailed'));
                              });
                            }
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
                {canEdit && isDrafting ? (
                  <motion.div
                    ref={draftRef}
                    key="voucher-draft"
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={ROW_TRANSITION}
                    onAnimationComplete={onDraftAnimationComplete}
                    className="border-border overflow-visible border-t first:border-t-0"
                  >
                    <AffiliateVoucherDraftRow
                      onCancel={() => {
                        setIsDrafting(false);
                      }}
                      onSaved={() => {
                        setIsDrafting(false);
                        toast.success(t('created'));
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <motion.p
              key="vouchers-empty"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted text-sm leading-relaxed"
            >
              {t('empty')}
            </motion.p>
          )}
        </AnimatePresence>
        {canEdit && !isDrafting ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            onPress={() => {
              setIsDrafting(true);
            }}
          >
            <Plus size={18} weight="bold" aria-hidden />
            {t('addVoucher')}
          </Button>
        ) : null}
      </div>
    </AccountSection>
  );
}
