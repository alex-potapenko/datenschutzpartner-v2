'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import {
  calculateEuRepQuote,
  EU_REP_PLANS,
  resolveEuRepPlan,
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  type EuRepPlanId,
} from '@/api/checkout';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { AnimatedDirectionalPanel } from '@/app/account/_components/AnimatedDirectionalPanel';
import { EuRepLinkPoliciesDialog } from '@/app/account/_components/EuRepLinkPoliciesDialog';
import { EuRepPlanCard, type EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  EuRepContractFields,
  type EuRepPostalFields,
} from '@/components/shared/EuRepContractFields';
import { RegularPage } from '@/components/shared/RegularPage';
import { Button, CaretLeft, CaretRight, Spinner, useOverlayState } from '@/components/ui';

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

const CHECKOUT_STEPS = ['entity', 'plan'] as const;
const ENTITY_STORAGE_KEY = 'eu-rep-checkout-entity';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DETAIL_TRANSITION = { duration: 0.24, ease: 'easeOut' } as const;

type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

type EntityDraft = {
  legalEntity: string;
  forwardingEmail: string;
} & EuRepPostalFields;

type EntityErrors = {
  legalEntity?: string;
  forwardingEmail?: string;
  postalLine1?: string;
  postalCode?: string;
  city?: string;
  country?: string;
};

function formatChf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function emptyEntity(): EntityDraft {
  return {
    legalEntity: '',
    forwardingEmail: '',
    postalLine1: '',
    postalLine2: '',
    postalCode: '',
    city: '',
    country: 'Schweiz',
  };
}

function isEuRepPlanId(value: string | null): value is EuRepPlanId {
  return value === 'basis' || value === 'plus' || value === 'plus5';
}

function readStoredEntity(): EntityDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ENTITY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EntityDraft;
  } catch {
    return null;
  }
}

function writeStoredEntity(entity: EntityDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ENTITY_STORAGE_KEY, JSON.stringify(entity));
}

function clearStoredEntity() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ENTITY_STORAGE_KEY);
}

function validateEntity(
  entity: EntityDraft,
  tValidation: ReturnType<typeof useTranslations>
): { ok: boolean; errors: EntityErrors } {
  const entityOk = entity.legalEntity.trim().length > 0;
  const emailOk = EMAIL_PATTERN.test(entity.forwardingEmail.trim());
  const line1Ok = entity.postalLine1.trim().length > 0;
  const codeOk = entity.postalCode.trim().length > 0;
  const cityOk = entity.city.trim().length > 0;
  const countryOk = entity.country.trim().length > 0;
  const errors: EntityErrors = {
    legalEntity: entityOk ? undefined : tValidation('required'),
    forwardingEmail: emailOk ? undefined : tValidation('email'),
    postalLine1: line1Ok ? undefined : tValidation('required'),
    postalCode: codeOk ? undefined : tValidation('required'),
    city: cityOk ? undefined : tValidation('required'),
    country: countryOk ? undefined : tValidation('required'),
  };

  return {
    ok: Object.values(errors).every((value) => !value),
    errors,
  };
}

function CheckoutPageShell({
  backLabel,
  backFallbackHref,
  onBackPress,
  children,
}: {
  backLabel: string;
  backFallbackHref: string;
  onBackPress?: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);

  const navigateBack = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backFallbackHref);
  }, [backFallbackHref, onBackPress, router]);

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
        className="flex min-h-0 flex-1 flex-col"
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

function CheckoutStepHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-border shrink-0 border-b">
      <div className="flex flex-col gap-3 px-4 pt-10 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
        <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
        {description ? (
          <p className="text-foreground text-base leading-relaxed">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutStepFooter({
  onBack,
  onContinue,
  ctaLabel,
  ctaDisabled,
}: {
  onBack?: () => void;
  onContinue: () => void;
  ctaLabel: ReactNode;
  ctaDisabled?: boolean;
}) {
  const t = useTranslations('common');

  return (
    <div className="border-border shrink-0 border-t">
      <div className="flex items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5">
        {onBack ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 shrink-0 gap-2 rounded-full px-5 sm:h-14 sm:px-8"
            onPress={onBack}
          >
            <CaretLeft size={16} weight="bold" />
            <span className="hidden sm:inline">{t('back')}</span>
          </Button>
        ) : (
          <div />
        )}
        <Button
          variant="primary"
          size="lg"
          className="h-11 min-w-0 gap-2 rounded-full px-6 sm:h-14 sm:px-8"
          onPress={onContinue}
          isDisabled={ctaDisabled}
        >
          <span className="truncate">{ctaLabel}</span>
          <CaretRight size={16} weight="bold" className="shrink-0" />
        </Button>
      </div>
    </div>
  );
}

function EntityStepPanel({
  entity,
  errors,
  onEntityChange,
}: {
  entity: EntityDraft;
  errors: EntityErrors;
  onEntityChange: (patch: Partial<EntityDraft>) => void;
}) {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <EuRepContractFields
        idPrefix="checkout"
        legalEntity={entity.legalEntity}
        forwardingEmail={entity.forwardingEmail}
        onLegalEntityChange={(value) => {
          onEntityChange({ legalEntity: value });
        }}
        onForwardingEmailChange={(value) => {
          onEntityChange({ forwardingEmail: value });
        }}
        legalEntityError={errors.legalEntity}
        forwardingEmailError={errors.forwardingEmail}
        postal={entity}
        onPostalChange={(patch) => {
          onEntityChange(patch);
        }}
        postalErrors={errors}
      />
    </div>
  );
}

function PlanStepPanel({
  checkoutPlans,
  selectedPlanId,
  onPlanChange,
  quote,
  plan,
  t,
  tPage,
  tp,
}: {
  checkoutPlans: EuRepPlan[];
  selectedPlanId: EuRepPlanId;
  onPlanChange: (planId: EuRepPlanId) => void;
  quote: ReturnType<typeof calculateEuRepQuote>;
  plan: ReturnType<typeof resolveEuRepPlan>;
  t: ReturnType<typeof useTranslations<'account.euRepCheckout'>>;
  tPage: ReturnType<typeof useTranslations<'euRepPage'>>;
  tp: ReturnType<typeof useTranslations<'euRepPage.pricingSection'>>;
}) {
  return (
    <EuRepPlanCard
      plans={checkoutPlans}
      defaultPlanId={selectedPlanId}
      value={selectedPlanId}
      onPlanChange={(planId) => {
        if (isEuRepPlanId(planId)) onPlanChange(planId);
      }}
      pricePeriod={tPage('pricePeriod')}
      priceAlign="center"
      showOrderCta={false}
      layout="standalone"
      fillHeight
      tabsAriaLabel={tp('entityCountLabel')}
      selectPlanTitle={t('selectPlan')}
      includedTitle={tp('includedToggle')}
      featuresCollapsible
      features={INCLUDED_KEYS.map((key) => tPage(`features.${key}`))}
      legal={tPage.rich('legal', {
        terms: (chunks) => <Link href="/terms">{chunks}</Link>,
      })}
      footerSectionClassName=""
      footerClassName=""
      postFeaturesFooter={
        <div className="flex flex-col gap-2">
          <p className="text-muted text-sm">{tPage(`plans.${plan.id}.requests`)}</p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-foreground text-base font-semibold">{t('totalDue')}</p>
            <p className="text-foreground shrink-0 text-base font-semibold">
              {formatChf(quote.amountDue)}
            </p>
          </div>
          <p className="text-muted text-xs leading-relaxed">{t('payrexxNote')}</p>
        </div>
      }
    />
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
  const searchParams = useSearchParams();
  const { isChecking } = useRequireSession('/account/eu-rep/checkout');
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();
  const linkDialog = useOverlayState();
  const isProcessing = createSession.isPending || completeSession.isPending;

  const returnTo = searchParams.get('returnTo');
  const backFallbackHref =
    returnTo && returnTo.startsWith('/account') ? returnTo : EU_REP_ACCOUNT_HREF;

  const stepParam = searchParams.get('step');
  const step: CheckoutStep = stepParam === 'plan' ? 'plan' : 'entity';

  const planParam = searchParams.get('plan');
  const initialPlan: EuRepPlanId = isEuRepPlanId(planParam) ? planParam : 'basis';
  const [selectedPlanId, setSelectedPlanId] = useState<EuRepPlanId>(initialPlan);
  const [entity, setEntity] = useState<EntityDraft>(() => readStoredEntity() ?? emptyEntity());
  const [errors, setErrors] = useState<EntityErrors>({});
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);

  const quote = useMemo(() => calculateEuRepQuote(selectedPlanId), [selectedPlanId]);
  const plan = resolveEuRepPlan(selectedPlanId);

  const checkoutPlans: EuRepPlan[] = useMemo(
    () =>
      EU_REP_PLANS.map((row) => ({
        id: row.id,
        tabLabel: tPage(`plans.${row.id}.name`),
        showPerYear: true,
        price: calculateEuRepQuote(row.id).amountDue.toFixed(2),
        note: tPage(`plans.${row.id}.requests`),
      })),
    [tPage]
  );

  const replaceStep = useCallback(
    (nextStep: CheckoutStep) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextStep === 'entity') {
        params.delete('step');
      } else {
        params.set('step', 'plan');
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : '/account/eu-rep/checkout', { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    writeStoredEntity(entity);
  }, [entity]);

  useEffect(() => {
    if (step !== 'plan') return;
    const { ok } = validateEntity(entity, tValidation);
    if (!ok) {
      replaceStep('entity');
    }
  }, [entity, replaceStep, step, tValidation]);

  function goToAccount() {
    clearStoredEntity();
    router.push(backFallbackHref);
  }

  function handleContractLinkingDone() {
    linkDialog.close();
    setCreatedContractId(null);
    goToAccount();
  }

  function handleContinueToPlan() {
    const result = validateEntity(entity, tValidation);
    setErrors(result.errors);
    if (!result.ok) return;
    writeStoredEntity(entity);
    replaceStep('plan');
  }

  function handleBackToEntity() {
    replaceStep('entity');
  }

  function handleShellBack() {
    if (step === 'plan') {
      handleBackToEntity();
      return;
    }

    clearStoredEntity();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backFallbackHref);
  }

  async function handlePay() {
    const result = validateEntity(entity, tValidation);
    setErrors(result.errors);
    if (!result.ok) {
      replaceStep('entity');
      return;
    }

    try {
      toast.info(t('redirecting'));
      const checkoutSession = await createSession.mutateAsync({
        kind: 'euRep',
        euRepPlanId: selectedPlanId,
        euRepEntityCount: 1,
        euRepEntities: [
          {
            legalEntity: entity.legalEntity.trim(),
            forwardingEmail: entity.forwardingEmail.trim(),
            postalLine1: entity.postalLine1.trim(),
            postalLine2: entity.postalLine2?.trim() || undefined,
            postalCode: entity.postalCode.trim(),
            city: entity.city.trim(),
            country: entity.country.trim(),
          },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 900));
      const paymentResult = await completeSession.mutateAsync(checkoutSession.id);
      toast.success(t('success'));
      clearStoredEntity();
      const createdId = paymentResult.euRepContractIds?.[0] ?? paymentResult.euRepContractId;
      if (paymentResult.needsPolicyLinking && createdId) {
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
      <CheckoutPageShell backLabel={tCommon('back')} backFallbackHref={backFallbackHref}>
        <div className="flex min-h-40 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      </CheckoutPageShell>
    );
  }

  return (
    <CheckoutPageShell
      backLabel={tCommon('back')}
      backFallbackHref={backFallbackHref}
      onBackPress={handleShellBack}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <CheckoutStepHeader
          title={step === 'entity' ? t('title') : t('selectPlan')}
          description={step === 'entity' ? t('entityIntro') : undefined}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatedDirectionalPanel activeKey={step} order={CHECKOUT_STEPS}>
            {step === 'entity' ? (
              <EntityStepPanel
                entity={entity}
                errors={errors}
                onEntityChange={(patch) => {
                  setEntity((current) => ({ ...current, ...patch }));
                }}
              />
            ) : (
              <PlanStepPanel
                checkoutPlans={checkoutPlans}
                selectedPlanId={selectedPlanId}
                onPlanChange={setSelectedPlanId}
                quote={quote}
                plan={plan}
                t={t}
                tPage={tPage}
                tp={tp}
              />
            )}
          </AnimatedDirectionalPanel>
        </div>
        <CheckoutStepFooter
          onBack={step === 'plan' ? handleBackToEntity : undefined}
          onContinue={step === 'entity' ? handleContinueToPlan : () => void handlePay()}
          ctaLabel={
            step === 'entity' ? (
              tCommon('continue')
            ) : isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" aria-hidden />
                {t('processing')}
              </span>
            ) : (
              t('payCta')
            )
          }
          ctaDisabled={step === 'plan' && isProcessing}
        />
      </div>

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
