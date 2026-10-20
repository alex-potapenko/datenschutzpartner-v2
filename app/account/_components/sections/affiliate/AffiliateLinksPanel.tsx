'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  isAffiliatePartnerEditable,
  useDeleteAffiliateReferralLink,
  type AffiliateDashboard,
  type AffiliateReferralLink,
} from '@/api/affiliate';
import {
  ArrowsLeftRight,
  Button,
  CalendarBlank,
  CurrencyDollar,
  CursorClick,
  Plus,
} from '@/components/ui';
import { AffiliatePartnerIdentityRow } from './AffiliatePartnerIdentityRow';
import { AffiliateReferralLinkDraftRow } from '../../AffiliateReferralLinkDraftRow';
import { AffiliateReferralLinkRow } from '../../AffiliateReferralLinkRow';
import { AccountSection, useDateFormatter } from '../../account-ui';
import { useAffiliateDraftScrollIntoView } from '../../useAffiliateDraftScrollIntoView';

const LINK_META_ICON_SIZE = 16;
const LINK_META_ICON_WEIGHT = 'regular' as const;

const REFERRAL_ROW_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const };

export function AffiliateLinksPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.links');
  const tDashboard = useTranslations('account.affiliate.dashboard');
  const reduceMotion = useReducedMotion();
  const formatDate = useDateFormatter();
  const deleteLink = useDeleteAffiliateReferralLink();
  const { partner, referralLinks } = dashboard;
  const canEdit = isAffiliatePartnerEditable(partner);
  const listAriaLabel = t('listTitle');
  const [isDrafting, setIsDrafting] = useState(false);
  const { draftRef, onDraftAnimationComplete } = useAffiliateDraftScrollIntoView(
    isDrafting,
    reduceMotion
  );

  function linkMeta(link: AffiliateReferralLink) {
    const iconProps = {
      size: LINK_META_ICON_SIZE,
      weight: LINK_META_ICON_WEIGHT,
      'aria-hidden': true,
    };
    return [
      {
        key: 'created',
        icon: <CalendarBlank {...iconProps} />,
        label: tDashboard('linkCreated'),
        value: formatDate(link.createdAt),
      },
      {
        key: 'visits',
        icon: <CursorClick {...iconProps} />,
        label: tDashboard('stats.clicks'),
        value: link.clicks,
      },
      {
        key: 'referrals',
        icon: <ArrowsLeftRight {...iconProps} />,
        label: tDashboard('stats.conversions'),
        value: link.conversions,
      },
      {
        key: 'balance',
        icon: <CurrencyDollar {...iconProps} />,
        label: tDashboard('stats.balance'),
        value: `CHF ${link.balanceChf.toFixed(2)}`,
      },
    ] as const;
  }

  const showListBox = referralLinks.length > 0 || (canEdit && isDrafting);

  return (
    <AccountSection contentClassName="gap-6">
      <AffiliatePartnerIdentityRow partner={partner} canEdit={canEdit} />
      <div className="flex min-w-0 flex-col gap-4" aria-label={listAriaLabel}>
        <AnimatePresence initial={false}>
          {showListBox ? (
            <div className="border-border flex flex-col overflow-visible rounded-xl border">
              <AnimatePresence initial={false} mode="popLayout">
                {referralLinks.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={REFERRAL_ROW_TRANSITION}
                    className="border-border overflow-visible border-t first:border-t-0"
                  >
                    <AffiliateReferralLinkRow
                      id={link.id}
                      label={tDashboard('linkFieldLabel')}
                      url={link.referralUrl}
                      meta={linkMeta(link)}
                      isDeleting={deleteLink.isPending}
                      onDelete={
                        canEdit
                          ? () => {
                              void deleteLink.mutateAsync(link.id).catch(() => {
                                toast.error(tDashboard('linkDeleteFailed'));
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
                    key="referral-link-draft"
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={REFERRAL_ROW_TRANSITION}
                    onAnimationComplete={onDraftAnimationComplete}
                    className="border-border overflow-visible border-t first:border-t-0"
                  >
                    <AffiliateReferralLinkDraftRow
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
              key="referral-links-empty"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted text-sm leading-relaxed"
            >
              {t('listEmpty')}
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
            {t('addLink')}
          </Button>
        ) : null}
      </div>
    </AccountSection>
  );
}
