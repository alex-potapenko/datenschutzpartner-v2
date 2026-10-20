'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import {
  AFFILIATE_SLUG_PATTERN,
  affiliateReferralLinkCreateSchema,
  useCreateAffiliateReferralLink,
  useDeleteAffiliateReferralLink,
  useUpdateAffiliateSlug,
  type AffiliateDashboard,
  type AffiliatePartner,
  type AffiliateReferralLink,
  type AffiliateReferralLinkCreate,
} from '@/api/affiliate';
import { Field } from '@/app/result/ui/FormSection';
import { FieldErrorText } from '@/components/shared/FieldErrorText';
import { Button, Input, InputGroup } from '@/components/ui';
import { AFFILIATE_REF_URL_PREFIX } from '@/lib/affiliate-attribution';
import { AffiliateReferralCopyButton } from '../../AffiliateReferralCopyButton';
import { AffiliateReferralLinkRow } from '../../AffiliateReferralLinkRow';
import { AccountSection, useDateFormatter } from '../../account-ui';

const REFERRAL_ROW_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const };

function AffiliateSlugField({ partner }: { partner: AffiliatePartner }) {
  const t = useTranslations('account.affiliate.links');
  const tDashboard = useTranslations('account.affiliate.dashboard');
  const tv = useTranslations('validation');
  const updateSlug = useUpdateAffiliateSlug();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const value = draft ?? partner.slug;

  function commit() {
    const next = value.trim();
    if (next === partner.slug) {
      setDraft(null);
      setError(null);
      return;
    }
    if (!AFFILIATE_SLUG_PATTERN.test(next)) {
      setError(tv('affiliateUsername'));
      return;
    }
    updateSlug.mutate(
      { slug: next },
      {
        onSuccess: () => {
          setDraft(null);
          setError(null);
          toast.success(t('slugSaved'));
        },
        onError: (cause) => {
          setError(
            cause instanceof ApiError && cause.status === 409
              ? t('slugTaken')
              : tv('affiliateUsername')
          );
        },
      }
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(partner.referralUrl);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(tDashboard('copyFailed'));
    }
  }

  return (
    <Field
      label={t('slugLabel')}
      htmlFor="affiliate-slug"
      hint={t('slugHint')}
      hintClassName="text-muted"
    >
      <div className="flex min-w-0 items-center gap-2">
        <InputGroup
          variant="secondary"
          fullWidth
          className="min-w-0 flex-1"
          data-invalid={Boolean(error) || undefined}
        >
          <InputGroup.Prefix className="text-muted max-w-[55%] truncate text-sm select-none sm:max-w-none sm:whitespace-nowrap">
            {AFFILIATE_REF_URL_PREFIX}
          </InputGroup.Prefix>
          <InputGroup.Input
            id="affiliate-slug"
            value={value}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
            }}
            aria-invalid={Boolean(error)}
            disabled={updateSlug.isPending}
          />
        </InputGroup>
        <AffiliateReferralCopyButton
          copied={copied}
          copyLabel={tDashboard('copyLink')}
          copiedLabel={tDashboard('linkCopied')}
          copiedTooltip={tDashboard('linkCopiedTooltip')}
          onCopy={() => {
            void copy();
          }}
        />
      </div>
      <FieldErrorText message={error} />
    </Field>
  );
}

function AffiliateLinkGenerator() {
  const t = useTranslations('account.affiliate.links');
  const tRoot = useTranslations();
  const createLink = useCreateAffiliateReferralLink();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AffiliateReferralLinkCreate>({
    resolver: zodResolver(affiliateReferralLinkCreateSchema),
    defaultValues: { targetPath: '', campaign: '' },
  });

  function onSubmit(values: AffiliateReferralLinkCreate) {
    createLink.mutate(values, {
      onSuccess: () => {
        reset();
        toast.success(t('created'));
      },
      onError: (cause) => {
        if (cause instanceof ApiError && cause.status === 409) {
          setError('targetPath', { message: 'account.affiliate.links.linkExists' });
          return;
        }
        if (cause instanceof ApiError && cause.status === 400) {
          setError('targetPath', { message: 'validation.affiliateTargetPath' });
          return;
        }
        toast.error(t('createFailed'));
      },
    });
  }

  const targetError = errors.targetPath?.message;
  const campaignError = errors.campaign?.message;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
        <Field label={t('targetLabel')} htmlFor="affiliate-link-target">
          <Input
            id="affiliate-link-target"
            variant="secondary"
            fullWidth
            inputMode="url"
            spellCheck={false}
            placeholder={t('targetPlaceholder')}
            aria-invalid={Boolean(targetError)}
            {...register('targetPath')}
          />
          <FieldErrorText message={targetError ? tRoot(targetError) : undefined} />
        </Field>
        <Field label={t('campaignLabel')} htmlFor="affiliate-link-campaign">
          <Input
            id="affiliate-link-campaign"
            variant="secondary"
            fullWidth
            spellCheck={false}
            placeholder={t('campaignPlaceholder')}
            aria-invalid={Boolean(campaignError)}
            {...register('campaign')}
          />
          <FieldErrorText message={campaignError ? tRoot(campaignError) : undefined} />
        </Field>
      </div>
      <div>
        <Button type="submit" variant="primary" size="md" isDisabled={createLink.isPending}>
          {t('create')}
        </Button>
      </div>
    </form>
  );
}

export function AffiliateLinksPanel({ dashboard }: { dashboard: AffiliateDashboard }) {
  const t = useTranslations('account.affiliate.links');
  const tDashboard = useTranslations('account.affiliate.dashboard');
  const reduceMotion = useReducedMotion();
  const formatDate = useDateFormatter();
  const deleteLink = useDeleteAffiliateReferralLink();
  const { partner, referralLinks } = dashboard;

  function linkMeta(link: AffiliateReferralLink) {
    return [
      {
        label: tDashboard('linkTarget'),
        value: link.targetPath === '/' ? tDashboard('homePage') : link.targetPath,
      },
      ...(link.campaign ? [{ label: tDashboard('linkCampaign'), value: link.campaign }] : []),
      { label: tDashboard('linkCreated'), value: formatDate(link.createdAt) },
      { label: tDashboard('stats.clicks'), value: link.clicks },
      { label: tDashboard('stats.conversions'), value: link.conversions },
      { label: tDashboard('stats.unpaidEarnings'), value: link.earningsChf.toFixed(2) },
    ];
  }

  return (
    <div className="divide-border flex min-w-0 flex-1 flex-col divide-y">
      <AccountSection title={t('partnerTitle')} contentClassName="gap-4">
        <p className="text-muted text-sm leading-relaxed">{t('partnerBody')}</p>
        <AffiliateSlugField partner={partner} />
      </AccountSection>

      <AccountSection title={t('generatorTitle')} contentClassName="gap-4">
        <p className="text-muted text-sm leading-relaxed">{t('generatorBody')}</p>
        <AffiliateLinkGenerator />
      </AccountSection>

      <AccountSection title={t('listTitle')} contentClassName="gap-4">
        <AnimatePresence initial={false}>
          {referralLinks.length > 0 ? (
            <motion.div
              key="referral-links"
              layout={reduceMotion ? false : 'size'}
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={REFERRAL_ROW_TRANSITION}
              className="border-border flex flex-col overflow-hidden rounded-xl border"
            >
              <AnimatePresence initial={false}>
                {referralLinks.map((link) => (
                  <motion.div
                    key={link.id}
                    layout={reduceMotion ? false : 'position'}
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={REFERRAL_ROW_TRANSITION}
                    className="border-border overflow-hidden border-t first:border-t-0"
                  >
                    <AffiliateReferralLinkRow
                      id={link.id}
                      label={tDashboard('linkFieldLabel')}
                      url={link.referralUrl}
                      meta={linkMeta(link)}
                      isDeleting={deleteLink.isPending}
                      onDelete={() => {
                        void deleteLink.mutateAsync(link.id).catch(() => {
                          toast.error(tDashboard('linkDeleteFailed'));
                        });
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
      </AccountSection>
    </div>
  );
}
