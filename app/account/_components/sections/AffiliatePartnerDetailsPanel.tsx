'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession } from '@/api/auth';
import {
  useAffiliateDashboard,
  useDeleteAffiliateReferralLink,
  type AffiliateReferralLink,
} from '@/api/affiliate';
import { AffiliatePartnerStatsRow } from '../AffiliatePartnerStatsRow';
import { AffiliateReferralLinkRow } from '../AffiliateReferralLinkRow';
import { AffiliateReferralsTable } from '../AffiliateReferralsTable';
import { AccountSection, useDateFormatter } from '../account-ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { AFFILIATE_ADMIN_HREF } from '@/lib/account-routes';

const REFERRAL_ROW_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const };

export function AffiliatePartnerDetailsPanel() {
  const t = useTranslations('account.affiliate');
  const reduceMotion = useReducedMotion();
  const formatDate = useDateFormatter();
  const session = useSession();
  const dashboard = useAffiliateDashboard();
  const deleteLink = useDeleteAffiliateReferralLink();

  const isAdmin = session.data?.role === 'admin';

  if (!dashboard.data) {
    return null;
  }

  const { partner, referralLinks, referrals, stats } = dashboard.data;
  const referralsTitle = t('dashboard.referralsTitle');
  const convertedReferrals =
    stats.referralCounts.pending + stats.referralCounts.unpaid + stats.referralCounts.paid;

  function linkMeta(link: AffiliateReferralLink) {
    return [
      {
        label: t('dashboard.linkTarget'),
        value: link.targetPath === '/' ? t('dashboard.homePage') : link.targetPath,
      },
      ...(link.campaign ? [{ label: t('dashboard.linkCampaign'), value: link.campaign }] : []),
      { label: t('dashboard.linkCreated'), value: formatDate(link.createdAt) },
      { label: t('dashboard.stats.clicks'), value: link.clicks },
      { label: t('dashboard.stats.conversions'), value: link.conversions },
      { label: t('dashboard.stats.unpaidEarnings'), value: link.earningsChf.toFixed(2) },
    ];
  }

  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      <AccountSection title={t('dashboard.linkTitle')} contentClassName="gap-6">
        <AffiliatePartnerStatsRow
          clicks={stats.visits}
          conversions={convertedReferrals}
          balanceChf={stats.unpaidEarningsChf}
        />

        <div className="border-border flex flex-col overflow-hidden rounded-xl border">
          <AffiliateReferralLinkRow
            id="base"
            label={t('dashboard.baseLinkLabel')}
            url={partner.referralUrl}
            meta={[
              { label: t('dashboard.linkTarget'), value: t('dashboard.homePage') },
              { label: t('dashboard.linkCreated'), value: formatDate(partner.approvedAt) },
            ]}
          />
          <AnimatePresence initial={false}>
            {referralLinks.map((link) => (
              <motion.div
                key={link.id}
                layout={reduceMotion ? false : 'position'}
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                transition={REFERRAL_ROW_TRANSITION}
                className="border-border overflow-hidden border-t"
              >
                <AffiliateReferralLinkRow
                  id={link.id}
                  label={t('dashboard.linkFieldLabel')}
                  url={link.referralUrl}
                  meta={linkMeta(link)}
                  isDeleting={deleteLink.isPending}
                  onDelete={() => {
                    void deleteLink.mutateAsync(link.id).catch(() => {
                      toast.error(t('dashboard.linkDeleteFailed'));
                    });
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isAdmin ? (
          <NavigationLink href={AFFILIATE_ADMIN_HREF} chevron="right" size="sm">
            {t('adminLink')}
          </NavigationLink>
        ) : null}
      </AccountSection>

      <AccountSection title={referralsTitle} contentClassName="gap-0">
        {referrals.length > 0 ? (
          <AffiliateReferralsTable referrals={referrals} ariaLabel={referralsTitle} />
        ) : (
          <p className="text-muted text-sm leading-relaxed">{t('dashboard.referralsEmpty')}</p>
        )}
      </AccountSection>
    </div>
  );
}
