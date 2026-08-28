'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import {
  calculateEuRepQuote,
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
} from '@/api/checkout';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { EuRepLinkPoliciesDialog } from '@/app/account/_components/EuRepLinkPoliciesDialog';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import { EuRepContractFields } from '@/components/shared/EuRepContractFields';
import { RegularPage } from '@/components/shared/RegularPage';
import { Button, CaretRight, Spinner, useOverlayState } from '@/components/ui';

const INCLUDED_KEYS = [
  'establishment',
  'art27',
  'mentionPolicy',
  'mentionRecords',
  'email',
  'post',
  'newsletter',
  'podcast',
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DETAIL_TRANSITION = { duration: 0.24, ease: 'easeOut' } as const;

type EntityDraft = {
  legalEntity: string;
  forwardingEmail: string;
};

type EntityErrors = {
  legalEntity?: string;
  forwardingEmail?: string;
};

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function emptyEntity(): EntityDraft {
  return { legalEntity: '', forwardingEmail: '' };
}

function CheckoutPageShell({
  backLabel,
  backFallbackHref,
  children,
}: {
  backLabel: string;
  backFallbackHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);

  const navigateBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backFallbackHref);
  }, [backFallbackHref, router]);

  const handleBack = useCallback(() => {
    if (shouldReduceMotion) {
      navigateBack();
      return;
    }

    setIsExiting(true);
  }, [navigateBack, shouldReduceMotion]);

  return (
    <RegularPage
      topBarVariant="account"
      showFooter={false}
      noPadding
      minimal
      backLink={{
        href: backFallbackHref,
        label: backLabel,
        preferHref: true,
        onPress: handleBack,
      }}
    >
      <motion.div
        className="flex flex-1 flex-col justify-center"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={isExiting ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
        transition={DETAIL_TRANSITION}
        onAnimationComplete={() => {
          if (isExiting) {
            navigateBack();
          }
        }}
      >
        {children}
      </motion.div>
    </RegularPage>
  );
}

export function EuRepCheckoutApp() {
  const t = useTranslations('account.euRepCheckout');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const tCommon = useTranslations('common');
  const tp = useTranslations('euRepPage.pricingSection');
  const tPage = useTranslations('euRepPage');
  const router = useRouter();
  const { isChecking } = useRequireSession('/account/eu-rep/checkout');
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const linkDialog = useOverlayState();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const [entity, setEntity] = useState<EntityDraft>(emptyEntity);
  const [errors, setErrors] = useState<EntityErrors>({});
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  const quote = useMemo(() => calculateEuRepQuote(1), []);

  const checkoutPlans: EuRepPlan[] = useMemo(
    () => [
      {
        id: 'single',
        tabLabel: '1',
        showPerYear: true,
        price: quote.amountDue.toFixed(2),
      },
    ],
    [quote.amountDue]
  );

  function validate(): boolean {
    const entityOk = entity.legalEntity.trim().length > 0;
    const emailOk = EMAIL_PATTERN.test(entity.forwardingEmail.trim());
    const nextErrors = {
      legalEntity: entityOk ? undefined : tValidation('required'),
      forwardingEmail: emailOk ? undefined : tValidation('email'),
    };
    setErrors(nextErrors);
    return !nextErrors.legalEntity && !nextErrors.forwardingEmail;
  }

  function goToAccount() {
    router.push(EU_REP_ACCOUNT_HREF);
  }

  function handleContractLinkingDone() {
    linkDialog.close();
    setCreatedContractId(null);
    goToAccount();
  }

  async function handlePay() {
    if (!validate()) return;
    try {
      toast.info(t('redirecting'));
      const checkoutSession = await createSession.mutateAsync({
        kind: 'euRep',
        euRepEntityCount: 1,
        euRepEntities: [
          {
            legalEntity: entity.legalEntity.trim(),
            forwardingEmail: entity.forwardingEmail.trim(),
          },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 900));
      const result = await completeSession.mutateAsync(checkoutSession.id);
      toast.success(t('success'));
      const createdId = result.euRepContractIds?.[0] ?? result.euRepContractId;
      if (result.needsPolicyLinking && createdId) {
        setCreatedContractId(createdId);
        linkDialog.open();
        return;
      }
      goToAccount();
    } catch {
      toast.error(t('failed'));
    }
  }

  if (isChecking) {
    return (
      <CheckoutPageShell backLabel={tCommon('back')} backFallbackHref={EU_REP_ACCOUNT_HREF}>
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </CheckoutPageShell>
    );
  }

  return (
    <CheckoutPageShell backLabel={tCommon('back')} backFallbackHref={EU_REP_ACCOUNT_HREF}>
      <EuRepPlanCard
        plans={checkoutPlans}
        defaultPlanId="single"
        value="single"
        pricePeriod={tPage('pricePeriod')}
        priceAlign="center"
        showOrderCta={false}
        layout="standalone"
        tabsAriaLabel={tp('entityCountLabel')}
        selectPlanTitle={t('title')}
        includedTitle={tp('includedToggle')}
        featuresCollapsible
        features={INCLUDED_KEYS.map((key) => tPage(`features.${key}`))}
        legal={tPage.rich('legal', {
          terms: (chunks) => <Link href="/terms">{chunks}</Link>,
        })}
        footerSectionClassName=""
        footerClassName=""
        footer={
          <div className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
            <EuRepContractFields
              idPrefix="checkout"
              legalEntity={entity.legalEntity}
              forwardingEmail={entity.forwardingEmail}
              onLegalEntityChange={(value) => {
                setEntity((current) => ({ ...current, legalEntity: value }));
              }}
              onForwardingEmailChange={(value) => {
                setEntity((current) => ({ ...current, forwardingEmail: value }));
              }}
              legalEntityError={errors.legalEntity}
              forwardingEmailError={errors.forwardingEmail}
            />
          </div>
        }
        postFeaturesFooter={
          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
            <p className="text-foreground shrink-0 text-base font-semibold">
              {formatChf(quote.amountDue)}
            </p>
          </div>
        }
        footerAction={
          <Button
            variant="primary"
            size="lg"
            className="font-display h-14 w-full gap-2 rounded-full text-base"
            onPress={() => void handlePay()}
            isDisabled={isProcessing}
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" aria-hidden />
                {t('processing')}
              </span>
            ) : (
              <>
                {t('payCta')}
                <CaretRight size={16} weight="bold" aria-hidden />
              </>
            )}
          </Button>
        }
      />

      {createdContractId ? (
        <EuRepLinkPoliciesDialog
          state={linkDialog}
          contractId={createdContractId}
          linkedDocumentIds={[]}
          closeOnComplete={false}
          onLinked={handleContractLinkingDone}
        />
      ) : null}
    </CheckoutPageShell>
  );
}
