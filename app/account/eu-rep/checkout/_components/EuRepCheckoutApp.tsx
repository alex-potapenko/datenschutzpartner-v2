'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRegister, useSession } from '@/api/auth';
import {
  calculateEuRepQuote,
  EU_REP_PLANS,
  formatDiscountPercent,
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  useValidateCheckoutPromo,
  type EuRepPlanId,
} from '@/api/checkout';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { safeEuRepCheckoutReturnTo } from '@/lib/account-routes';
import { cn } from '@/lib/utils';
import type { EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  EuRepContractFields,
  type EuRepPostalFields,
} from '@/components/shared/EuRepContractFields';
import { Container } from '@/components/shared/Container';
import {
  ServiceCheckoutScrollLayout,
  ServiceCheckoutShell,
  ServiceCheckoutStepHeader,
  ServiceWizardAccentHeader,
} from '@/components/shared/ServiceCheckoutFrame';
import { ServiceCheckoutLayout } from '@/components/shared/ServiceCheckoutLayout';
import { ServiceWizardFaqPanel } from '@/components/shared/ServiceWizardFaqPanel';
import {
  ServiceCheckoutPlanCard,
  formatCheckoutChf,
} from '@/components/shared/ServiceCheckoutPlanCard';
import { PromoCodeField } from '@/components/shared/PromoCodeField';
import { StepFrame } from '@/app/result/ui/StepFrame';
import { StepFooter } from '@/app/result/ui/StepFooter';
import { WizardBorderedColumn } from '@/app/result/ui/WizardBorderedColumn';
import { EuRepCheckoutStepBar, type EuRepCheckoutStepId } from './EuRepCheckoutStepBar';
import { EuRepCheckoutWelcomeBenefits } from './EuRepCheckoutWelcomeBenefits';
import {
  Button,
  CaretRight,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  Spinner,
  useOverlayState,
} from '@/components/ui';
import { PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import { useConfirmingPaymentFlow } from '@/lib/use-confirming-payment-flow';
import { payrexxOrderLinesFromEuRepCheckout } from '@/lib/payrexx-order-lines';
import { usePayrexxOrderLineLabels } from '@/lib/use-payrexx-order-line-labels';
import { usePayrexxPaymentFlow } from '@/lib/use-payrexx-payment-flow';
import { CheckoutPaymentButtonSpinner } from '@/components/shared/CheckoutPaymentButtonSpinner';
import { PayrexxPaymentScreen } from '@/components/shared/PayrexxPaymentScreen';
import { ConfirmingStatusScreen } from '@/components/shared/ConfirmingStatusScreen';
import { PaymentConfirmationCrossfade } from '@/components/shared/PaymentConfirmationCrossfade';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  EuRepCheckoutGuestFields,
  EuRepCheckoutGuestCheckboxes,
  type EuRepGuestAccountDraft,
  type EuRepGuestAccountErrors,
} from './EuRepCheckoutGuestFields';
import { EuRepCheckoutActivation } from './EuRepCheckoutActivation';
import {
  applyPromoDiscount,
  calculatePromoDiscountAmount,
  type PromoCodeDiscount,
} from '@/lib/promo-codes';

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

const ENTITY_STORAGE_KEY = 'eu-rep-checkout-entity';
import { euRepEntityFieldsSchema, mapZodFieldErrors } from '@/lib/validation/fields';

type EntityDraft = {
  legalEntity: string;
  forwardingEmail: string;
} & EuRepPostalFields;

type EntityErrors = {
  legalEntity?: string;
  forwardingEmail?: string;
  postalDepartment?: string;
  postalLine1?: string;
  postalLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
};

function emptyEntity(): EntityDraft {
  return {
    legalEntity: '',
    forwardingEmail: '',
    postalDepartment: '',
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

function hasEntityProgress(entity: EntityDraft): boolean {
  return (
    entity.legalEntity.trim() !== '' ||
    entity.forwardingEmail.trim() !== '' ||
    entity.postalLine1.trim() !== '' ||
    (entity.postalLine2?.trim() ?? '') !== '' ||
    entity.postalCode.trim() !== '' ||
    entity.city.trim() !== ''
  );
}

function resolveGuestForwardingEmail(entity: EntityDraft, guestEmail: string): EntityDraft {
  const trimmedGuestEmail = guestEmail.trim();
  if (!trimmedGuestEmail || entity.forwardingEmail.trim()) return entity;
  return { ...entity, forwardingEmail: trimmedGuestEmail };
}

function validateEntity(
  entity: EntityDraft,
  tValidation: ReturnType<typeof useTranslations>
): { ok: boolean; errors: EntityErrors } {
  const result = euRepEntityFieldsSchema.safeParse({
    legalEntity: entity.legalEntity,
    forwardingEmail: entity.forwardingEmail,
    postalDepartment: entity.postalDepartment ?? '',
    postalLine1: entity.postalLine1,
    postalLine2: entity.postalLine2 ?? '',
    postalCode: entity.postalCode,
    city: entity.city,
    country: entity.country,
  });

  if (result.success) {
    return { ok: true, errors: {} };
  }

  return {
    ok: false,
    errors: mapZodFieldErrors(result.error, tValidation),
  };
}

function emptyGuestAccount(): EuRepGuestAccountDraft {
  return {
    firstName: '',
    lastName: '',
    email: '',
    acceptTerms: false,
    newsletter: false,
  };
}

function validateGuestAccount(
  account: EuRepGuestAccountDraft,
  tValidation: ReturnType<typeof useTranslations>
): { ok: boolean; errors: EuRepGuestAccountErrors } {
  const schema = z.object({
    firstName: z
      .string()
      .trim()
      .min(1, tValidation('required'))
      .regex(PERSON_NAME_PATTERN, tValidation('personName')),
    lastName: z
      .string()
      .trim()
      .min(1, tValidation('required'))
      .regex(PERSON_NAME_PATTERN, tValidation('personName')),
    email: z.email(tValidation('email')),
    acceptTerms: z.boolean().refine((value) => value, { message: tValidation('terms') }),
    newsletter: z.boolean(),
  });

  const result = schema.safeParse(account);
  if (result.success) {
    return { ok: true, errors: {} };
  }

  const errors: EuRepGuestAccountErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in errors)) {
      errors[key as keyof EuRepGuestAccountDraft] = issue.message;
    }
  }

  return { ok: false, errors };
}

function collectCheckoutValidationIssues({
  entity,
  guestAccount,
  includeGuestFields,
  tValidation,
}: {
  entity: EntityDraft;
  guestAccount: EuRepGuestAccountDraft;
  includeGuestFields: boolean;
  tValidation: ReturnType<typeof useTranslations>;
}): {
  ok: boolean;
  entityErrors: EntityErrors;
  guestErrors: EuRepGuestAccountErrors;
} {
  const entityResult = validateEntity(entity, tValidation);
  const guestResult = includeGuestFields
    ? validateGuestAccount(guestAccount, tValidation)
    : { ok: true, errors: {} as EuRepGuestAccountErrors };

  return {
    ok: entityResult.ok && guestResult.ok,
    entityErrors: entityResult.errors,
    guestErrors: guestResult.errors,
  };
}

function hasCheckoutErrorsBesidesTermsAcceptance(
  entityErrors: EntityErrors,
  guestErrors: EuRepGuestAccountErrors
): boolean {
  if (Object.values(entityErrors).some(Boolean)) return true;

  return Object.entries(guestErrors).some(
    ([key, message]) => Boolean(message) && key !== 'acceptTerms'
  );
}

export function EuRepCheckoutApp() {
  const t = useTranslations('account.euRepCheckout');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const tCancel = useTranslations('account.euRepCheckout.cancelModal');
  const tService = useTranslations('services.euRep');
  const tp = useTranslations('euRepPage.pricingSection');
  const tPage = useTranslations('euRepPage');
  const tGuest = useTranslations('account.euRepCheckout.guest');
  const tSummary = useTranslations('result.summary');
  const tCommon = useTranslations('common');
  const orderLabels = usePayrexxOrderLineLabels();
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const registerAccount = useRegister();
  const isAuthenticated = Boolean(session.data?.email);
  const isChecking = session.isLoading || session.isFetching;
  const reduceMotion = useReducedMotion();
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();

  const returnTo = safeEuRepCheckoutReturnTo(searchParams.get('returnTo'));
  const backFallbackHref = returnTo ?? EU_REP_ACCOUNT_HREF;

  const planParam = searchParams.get('plan');
  const initialPlan: EuRepPlanId = isEuRepPlanId(planParam) ? planParam : 'basis';
  const [selectedPlanId, setSelectedPlanId] = useState<EuRepPlanId>(initialPlan);
  const [entity, setEntity] = useState<EntityDraft>(() => readStoredEntity() ?? emptyEntity());
  const forwardingEmailTouchedRef = useRef(Boolean(readStoredEntity()?.forwardingEmail.trim()));
  const [errors, setErrors] = useState<EntityErrors>({});
  const [guestAccount, setGuestAccount] = useState<EuRepGuestAccountDraft>(emptyGuestAccount);
  const [guestErrors, setGuestErrors] = useState<EuRepGuestAccountErrors>({});
  const [loggedOrderConfirmation, setLoggedOrderConfirmation] = useState<{
    contractId: string;
  } | null>(null);
  const [guestOrderConfirmation, setGuestOrderConfirmation] = useState<{ email: string } | null>(
    null
  );
  // POC STUB (Payrexx): in-page simulation; production redirects to the session's Payrexx URL.
  const payrexx = usePayrexxPaymentFlow();
  const { phase: accountPhase, run: runCreateAccountFlow } = useConfirmingPaymentFlow();
  const validationModal = useOverlayState();
  const checkoutConfirm = useOverlayState();
  const pendingCheckoutActionRef = useRef<(() => Promise<void>) | null>(null);
  const [promoDraft, setPromoDraft] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<PromoCodeDiscount | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const validateCheckoutPromo = useValidateCheckoutPromo();
  const [guestCheckoutStep, setGuestCheckoutStep] = useState<EuRepCheckoutStepId>('entity');
  const quote = useMemo(() => calculateEuRepQuote(selectedPlanId), [selectedPlanId]);
  const appliedPromo = useMemo((): { code: string; discount: PromoCodeDiscount } | null => {
    if (!appliedPromoCode || !appliedPromoDiscount) return null;
    return { code: appliedPromoCode, discount: appliedPromoDiscount };
  }, [appliedPromoCode, appliedPromoDiscount]);
  const promoDiscountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    return calculatePromoDiscountAmount(quote.amountDue, appliedPromo.discount);
  }, [appliedPromo, quote.amountDue]);
  const checkoutSubtotal = useMemo(() => {
    if (!appliedPromo) return quote.amountDue;
    return applyPromoDiscount(quote.amountDue, appliedPromo.discount);
  }, [appliedPromo, quote.amountDue]);
  const promoBreakdownLines = useMemo(() => {
    if (!appliedPromo || promoDiscountAmount <= 0) return undefined;

    const selectedPlanLabel = tPage(`plans.${selectedPlanId}.name`);
    const discountLabel =
      appliedPromo.discount.kind === 'percent'
        ? t('promoCode.discountPercent', {
            code: appliedPromo.code,
            percent: formatDiscountPercent(appliedPromo.discount.rate),
          })
        : t('promoCode.discountFixed', { code: appliedPromo.code });

    return [
      {
        label: t('activation.plan', { plan: selectedPlanLabel }),
        amount: formatCheckoutChf(quote.amountDue),
      },
      {
        label: discountLabel,
        amount: `− ${formatCheckoutChf(promoDiscountAmount)}`,
        amountClassName: 'text-success',
      },
    ];
  }, [appliedPromo, promoDiscountAmount, quote.amountDue, selectedPlanId, t, tPage]);
  const selectedPlanLabel = tPage(`plans.${selectedPlanId}.name`);
  const payrexxOrderLines = useMemo(
    () =>
      payrexxOrderLinesFromEuRepCheckout({
        planLabel: selectedPlanLabel,
        legalEntity: entity.legalEntity,
        labels: orderLabels,
      }),
    [entity.legalEntity, orderLabels, selectedPlanLabel]
  );
  const confirmQuit = hasEntityProgress(entity) || selectedPlanId !== initialPlan;
  const isContinueLoading = payrexx.isOpening;
  const isProcessing =
    isContinueLoading ||
    payrexx.phase !== 'idle' ||
    accountPhase !== 'idle' ||
    createSession.isPending ||
    completeSession.isPending ||
    registerAccount.isPending;

  const checkoutPlans: EuRepPlan[] = useMemo(
    () =>
      EU_REP_PLANS.map((row) => ({
        id: row.id,
        tabLabel: tPage(`plans.${row.id}.name`),
        showPerYear: true,
        price: calculateEuRepQuote(row.id).amountDue.toFixed(2),
      })),
    [tPage]
  );

  useEffect(() => {
    if (searchParams.get('step') !== 'plan') return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('step');
    const query = params.toString();
    router.replace(query ? `?${query}` : '/account/eu-rep/checkout', { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    writeStoredEntity(entity);
  }, [entity]);

  function handleShellQuit() {
    clearStoredEntity();
  }

  function clearGuestError(key: keyof EuRepGuestAccountDraft) {
    setGuestErrors((current) => {
      if (!current[key]) return current;
      return Object.fromEntries(Object.entries(current).filter(([entryKey]) => entryKey !== key));
    });
  }

  function clearEntityError(key: keyof EntityErrors) {
    setErrors((current) => {
      if (!current[key]) return current;
      return Object.fromEntries(Object.entries(current).filter(([entryKey]) => entryKey !== key));
    });
  }

  function clearAddressErrors() {
    setErrors((current) => {
      if (!current.postalLine1 && !current.postalCode && !current.city) return current;
      const next = { ...current };
      delete next.postalLine1;
      delete next.postalCode;
      delete next.city;
      return next;
    });
  }

  async function handleApplyPromo() {
    const code = promoDraft.trim();
    if (!code) return;

    try {
      const result = await validateCheckoutPromo.mutateAsync(code);
      if (!result.valid || !result.discount) {
        setAppliedPromoCode(null);
        setAppliedPromoDiscount(null);
        setPromoError(t('promoCode.invalid'));
        return;
      }

      setAppliedPromoCode(result.normalizedCode ?? code.toUpperCase());
      setAppliedPromoDiscount(result.discount);
      setPromoError(null);
    } catch {
      setAppliedPromoCode(null);
      setAppliedPromoDiscount(null);
      setPromoError(t('promoCode.invalid'));
    }
  }

  function handleRemovePromo() {
    setAppliedPromoCode(null);
    setAppliedPromoDiscount(null);
    setPromoDraft('');
    setPromoError(null);
  }

  function handleContinueFromEntity() {
    const validation = validateEntity(entity, tValidation);
    setErrors(validation.errors);
    if (!validation.ok) {
      if (Object.values(validation.errors).some(Boolean)) {
        validationModal.open();
      }
      return;
    }

    setGuestCheckoutStep('account');
  }

  function handleBackToEntity() {
    setGuestCheckoutStep('entity');
  }

  async function executeCheckout() {
    const entityForCheckout = !isAuthenticated
      ? resolveGuestForwardingEmail(entity, guestAccount.email)
      : entity;

    const euRepEntities = [
      {
        legalEntity: entityForCheckout.legalEntity.trim(),
        forwardingEmail: entityForCheckout.forwardingEmail.trim(),
        postalDepartment: entityForCheckout.postalDepartment?.trim() ?? '',
        postalLine1: entityForCheckout.postalLine1.trim(),
        postalLine2: entityForCheckout.postalLine2?.trim() ?? '',
        postalCode: entityForCheckout.postalCode.trim(),
        city: entityForCheckout.city.trim(),
        country: entityForCheckout.country.trim() || 'Schweiz',
      },
    ];

    if (!isAuthenticated) {
      try {
        await runCreateAccountFlow(async () => {
          const result = await registerAccount.mutateAsync({
            email: guestAccount.email.trim(),
            firstName: guestAccount.firstName.trim(),
            lastName: guestAccount.lastName.trim(),
            acceptTerms: guestAccount.acceptTerms,
            newsletter: guestAccount.newsletter,
            euRepPlanId: selectedPlanId,
            euRepEntityCount: 1,
            euRepEntities,
          });
          clearStoredEntity();
          setGuestOrderConfirmation({ email: result.email });
        });
      } catch {
        toast.error(tGuest('registrationFailed'));
      }
      return;
    }

    void payrexx.open(async () => {
      const checkoutSession = await createSession.mutateAsync({
        kind: 'euRep',
        euRepPlanId: selectedPlanId,
        euRepEntityCount: 1,
        euRepEntities,
        promoCode: appliedPromoCode ?? undefined,
      });
      const result = await completeSession.mutateAsync(checkoutSession.id);
      const contractId = result.euRepContractId ?? result.euRepContractIds?.[0];
      if (!contractId) {
        throw new Error('Missing EU rep contract id');
      }
      clearStoredEntity();
      setLoggedOrderConfirmation({ contractId });
    });
  }

  async function handlePayrexxPay() {
    try {
      await payrexx.pay();
    } catch {
      toast.error(t('failed'));
    }
  }

  function handlePay() {
    const entityForCheckout = !isAuthenticated
      ? resolveGuestForwardingEmail(entity, guestAccount.email)
      : entity;

    const validation = collectCheckoutValidationIssues({
      entity: entityForCheckout,
      guestAccount,
      includeGuestFields: !isAuthenticated,
      tValidation,
    });

    setErrors(validation.entityErrors);
    if (!isAuthenticated) {
      setGuestErrors(validation.guestErrors);
    }

    if (!validation.ok) {
      if (
        hasCheckoutErrorsBesidesTermsAcceptance(validation.entityErrors, validation.guestErrors)
      ) {
        validationModal.open();
      }
      return;
    }

    pendingCheckoutActionRef.current = executeCheckout;
    checkoutConfirm.open();
  }

  async function handleConfirmCheckout() {
    const action = pendingCheckoutActionRef.current;
    if (!action) return;

    checkoutConfirm.close();
    try {
      await action();
    } finally {
      pendingCheckoutActionRef.current = null;
    }
  }

  const shellProps = {
    serviceLabel: tService('label'),
    serviceBrandId: 'euRep' as const,
    quitHref: backFallbackHref,
    onQuit: handleShellQuit,
    faqContent: <ServiceWizardFaqPanel variant="euRep" />,
    confirmQuit,
    cancelTitle: tCancel('title'),
    cancelBody: tCancel('body'),
    cancelQuitLabel: tCancel('quit'),
    cancelProceedLabel: tCancel('proceed'),
  };

  const legalEntityName = entity.legalEntity.trim();
  const accentHeader = (
    <ServiceWizardAccentHeader
      title={legalEntityName || t('accentHeaderPlaceholder')}
      placeholder={!legalEntityName}
    />
  );

  if (isChecking) {
    return (
      <ServiceCheckoutShell {...shellProps}>
        {accentHeader}
        <StepFrame centerContent>
          <Container>
            <div className="border-border flex min-h-32 items-center justify-center border-r border-l py-10">
              <Spinner aria-label={tAccount('loading')} />
            </div>
          </Container>
        </StepFrame>
      </ServiceCheckoutShell>
    );
  }

  if (!isAuthenticated && (accountPhase === 'confirming' || accountPhase === 'confirmed')) {
    return (
      <PaymentConfirmationCrossfade
        phase={accountPhase}
        confirming={<ConfirmingStatusScreen title={tSummary('creatingAccountTitle')} />}
        confirmed={
          guestOrderConfirmation ? (
            <EuRepCheckoutActivation
              variant="guest"
              email={guestOrderConfirmation.email}
              legalEntity={entity.legalEntity}
              planLabel={selectedPlanLabel}
              amount={checkoutSubtotal}
              newsletterOptIn={guestAccount.newsletter}
            />
          ) : null
        }
      />
    );
  }

  if (payrexx.phase !== 'idle') {
    return (
      <PaymentConfirmationCrossfade
        phase={payrexx.phase}
        confirming={
          <PayrexxPaymentScreen
            items={payrexxOrderLines}
            amountExclVat={checkoutSubtotal}
            isPaying={payrexx.isPaying}
            onPay={() => void handlePayrexxPay()}
            onCancel={payrexx.cancel}
          />
        }
        confirmed={
          loggedOrderConfirmation ? (
            <EuRepCheckoutActivation
              variant="logged"
              contractId={loggedOrderConfirmation.contractId}
              legalEntity={entity.legalEntity}
              planLabel={selectedPlanLabel}
              amount={checkoutSubtotal}
            />
          ) : null
        }
      />
    );
  }

  function handleGuestAccountChange(patch: Partial<EuRepGuestAccountDraft>) {
    setGuestAccount((current) => {
      const next = { ...current, ...patch };
      if (!('email' in patch)) return next;

      const previousEmail = current.email;
      const nextEmail = patch.email ?? current.email;
      setEntity((entityCurrent) => {
        if (forwardingEmailTouchedRef.current) return entityCurrent;

        const forwarding = entityCurrent.forwardingEmail;
        if (forwarding.trim() !== '' && forwarding !== previousEmail) {
          return entityCurrent;
        }

        return { ...entityCurrent, forwardingEmail: nextEmail };
      });

      return next;
    });
  }

  const entitySection = (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-semibold">{t('entitySectionTitle')}</h3>
        <p className="text-muted text-sm leading-relaxed">{t('entityIntro')}</p>
      </div>
      <EuRepContractFields
        idPrefix="checkout"
        legalEntity={entity.legalEntity}
        forwardingEmail={entity.forwardingEmail}
        onLegalEntityChange={(value) => {
          setEntity((current) => ({ ...current, legalEntity: value }));
          clearEntityError('legalEntity');
        }}
        onForwardingEmailChange={(value) => {
          forwardingEmailTouchedRef.current = true;
          setEntity((current) => ({ ...current, forwardingEmail: value }));
          clearEntityError('forwardingEmail');
        }}
        onLegalEntityFocus={() => {
          clearEntityError('legalEntity');
        }}
        onForwardingEmailFocus={() => {
          clearEntityError('forwardingEmail');
        }}
        onPostalFieldFocus={clearAddressErrors}
        legalEntityError={errors.legalEntity}
        forwardingEmailError={errors.forwardingEmail}
        postal={entity}
        onPostalChange={(patch) => {
          setEntity((current) => ({ ...current, ...patch }));
          if ('postalLine2' in patch || 'postalDepartment' in patch) {
            if ('postalLine2' in patch) clearEntityError('postalLine2');
            if ('postalDepartment' in patch) clearEntityError('postalDepartment');
            return;
          }
          clearAddressErrors();
        }}
        postalErrors={errors}
      />
    </section>
  );

  const payButton = (
    <Button
      variant="primary"
      size="lg"
      className={cn(
        'font-display h-11 w-full gap-2 rounded-full px-6 text-base sm:h-14 sm:px-8',
        isContinueLoading && '!opacity-100'
      )}
      onPress={() => {
        handlePay();
      }}
      isDisabled={isContinueLoading}
    >
      {isContinueLoading ? (
        <CheckoutPaymentButtonSpinner label={t('processing')} />
      ) : (
        <>
          {t('payCta')}
          <CaretRight size={16} weight="bold" aria-hidden />
        </>
      )}
    </Button>
  );

  const planCard = (footerAction?: ReactNode) => (
    <ServiceCheckoutPlanCard
      plans={checkoutPlans}
      selectedPlanId={selectedPlanId}
      onPlanChange={(planId) => {
        if (isEuRepPlanId(planId)) setSelectedPlanId(planId);
      }}
      pricePeriod={tPage('pricePeriod')}
      tabsAriaLabel={tp('entityCountLabel')}
      selectPlanTitle={t('chosenPlan')}
      includedTitle={tp('includedToggle')}
      features={INCLUDED_KEYS.map((key) => tPage(`features.${key}`))}
      legal={tPage.rich('legalCheckout', {
        terms: (chunks) => <Link href="/terms">{chunks}</Link>,
      })}
      breakdownLines={promoBreakdownLines}
      subtotalExclVat={checkoutSubtotal}
      preBreakdownFooter={
        isAuthenticated ? (
          <PromoCodeField
            value={promoDraft}
            appliedCode={appliedPromo?.code}
            error={promoError}
            onChange={(value) => {
              setPromoDraft(value);
              if (promoError) setPromoError(null);
            }}
            onApply={() => {
              void handleApplyPromo();
            }}
            onRemove={handleRemovePromo}
            disabled={isProcessing || validateCheckoutPromo.isPending}
          />
        ) : null
      }
      footerAction={footerAction}
    />
  );

  const checkoutDialogs = (
    <>
      <ModalRoot state={validationModal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{t('validationAlert.title')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <div className="text-foreground flex flex-col gap-3 text-sm leading-relaxed">
                  <p>{t('validationAlert.body')}</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>{tQuestionnaire('fields.streetLine2')}</li>
                  </ul>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="primary"
                  onPress={() => {
                    validationModal.close();
                  }}
                >
                  {t('validationAlert.ok')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>

      <ConfirmDialog
        state={checkoutConfirm}
        title={t('checkoutConfirm.title')}
        body={t('checkoutConfirm.body')}
        confirmLabel={tCommon('continue')}
        cancelLabel={tSummary('keepEditing')}
        destructive={false}
        isPending={isProcessing}
        onConfirm={() => {
          void handleConfirmCheckout();
        }}
      />
    </>
  );

  if (!isAuthenticated) {
    return (
      <ServiceCheckoutShell {...shellProps}>
        <ServiceCheckoutScrollLayout>
          {accentHeader}
          <EuRepCheckoutStepBar currentStepId={guestCheckoutStep} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={guestCheckoutStep}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="flex min-h-full flex-1 flex-col"
            >
              {guestCheckoutStep === 'account' ? (
                <StepFrame
                  scrollWithContent
                  header={<ServiceCheckoutStepHeader title={t('guestAccountTitle')} />}
                  footer={<StepFooter onBack={handleBackToEntity} />}
                >
                  <Container className="flex min-h-full flex-1 flex-col">
                    <WizardBorderedColumn className="flex min-h-0 flex-1 flex-col">
                      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch lg:grid-cols-2">
                        <div className="border-border flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
                          <div className="shrink-0 px-4 pt-8 sm:px-8 lg:pt-12">
                            <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                              {tGuest('title')}
                            </h2>
                          </div>
                          <div className="flex flex-col gap-6 px-4 pt-8 pb-8 sm:px-8 sm:pb-10 lg:pb-12">
                            <EuRepCheckoutGuestFields
                              value={guestAccount}
                              errors={guestErrors}
                              showIntro={false}
                              onChange={handleGuestAccountChange}
                              onClearError={clearGuestError}
                            />
                            <EuRepCheckoutGuestCheckboxes
                              value={guestAccount}
                              errors={guestErrors}
                              onChange={handleGuestAccountChange}
                              onClearError={clearGuestError}
                            />
                            {payButton}
                          </div>
                        </div>
                        <div className="flex min-h-0 flex-col overflow-visible px-4 py-8 sm:px-8 sm:py-10 lg:py-12">
                          <EuRepCheckoutWelcomeBenefits />
                        </div>
                      </div>
                    </WizardBorderedColumn>
                  </Container>
                </StepFrame>
              ) : (
                <StepFrame
                  contentOverflowVisible
                  footer={
                    <StepFooter
                      onContinue={handleContinueFromEntity}
                      ctaLabel={tCommon('continue')}
                      ctaDisabled={isProcessing}
                    />
                  }
                >
                  <ServiceCheckoutStepHeader title={t('guestEntityStepTitle')} />
                  <ServiceCheckoutLayout aside={entitySection}>{planCard()}</ServiceCheckoutLayout>
                </StepFrame>
              )}
            </motion.div>
          </AnimatePresence>
        </ServiceCheckoutScrollLayout>
        {checkoutDialogs}
      </ServiceCheckoutShell>
    );
  }

  return (
    <ServiceCheckoutShell {...shellProps}>
      <div className="flex min-h-0 flex-1 flex-col">
        {accentHeader}
        <StepFrame contentOverflowVisible>
          <ServiceCheckoutStepHeader title={t('title')} />
          <ServiceCheckoutLayout aside={entitySection}>
            {planCard(<div className="flex flex-col gap-5">{payButton}</div>)}
          </ServiceCheckoutLayout>
        </StepFrame>
      </div>
      {checkoutDialogs}
    </ServiceCheckoutShell>
  );
}
