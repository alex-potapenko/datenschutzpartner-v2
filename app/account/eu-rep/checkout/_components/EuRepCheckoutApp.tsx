'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRegister, useSession } from '@/api/auth';
import {
  calculateEuRepQuote,
  EU_REP_PLANS,
  useCompleteCheckoutSession,
  useCreateCheckoutSession,
  type EuRepPlanId,
} from '@/api/checkout';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { safeAccountReturnTo, safeEuRepCheckoutReturnTo } from '@/lib/account-routes';
import type { EuRepPlan } from '@/app/eu-rep/_components/EuRepPlanCard';
import {
  EuRepContractFields,
  type EuRepPostalFields,
} from '@/components/shared/EuRepContractFields';
import { Container } from '@/components/shared/Container';
import {
  ServiceCheckoutShell,
  ServiceCheckoutStepHeader,
} from '@/components/shared/ServiceCheckoutFrame';
import { ServiceCheckoutLayout } from '@/components/shared/ServiceCheckoutLayout';
import { ServiceWizardFaqPanel } from '@/components/shared/ServiceWizardFaqPanel';
import { ServiceCheckoutPlanCard } from '@/components/shared/ServiceCheckoutPlanCard';
import { StepFrame } from '@/app/result/ui/StepFrame';
import { Button, CaretRight, Spinner } from '@/components/ui';
import { PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import { EuRepCheckoutActivation } from './EuRepCheckoutActivation';
import {
  EuRepCheckoutGuestFields,
  type EuRepGuestAccountDraft,
  type EuRepGuestAccountErrors,
} from './EuRepCheckoutGuestFields';

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
  postalLine1?: string;
  postalCode?: string;
  city?: string;
  country?: string;
};

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

function validateEntity(
  entity: EntityDraft,
  tValidation: ReturnType<typeof useTranslations>
): { ok: boolean; errors: EntityErrors } {
  const result = euRepEntityFieldsSchema.safeParse({
    legalEntity: entity.legalEntity,
    forwardingEmail: entity.forwardingEmail,
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

export function EuRepCheckoutApp() {
  const t = useTranslations('account.euRepCheckout');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const tCancel = useTranslations('account.euRepCheckout.cancelModal');
  const tService = useTranslations('services.euRep');
  const tp = useTranslations('euRepPage.pricingSection');
  const tPage = useTranslations('euRepPage');
  const tGuest = useTranslations('account.euRepCheckout.guest');
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const registerAccount = useRegister();
  const isAuthenticated = Boolean(session.data?.email);
  const isChecking = session.isLoading || session.isFetching;
  const createSession = useCreateCheckoutSession();
  const completeSession = useCompleteCheckoutSession();

  const returnTo = safeEuRepCheckoutReturnTo(searchParams.get('returnTo'));
  const backFallbackHref = returnTo ?? EU_REP_ACCOUNT_HREF;

  const planParam = searchParams.get('plan');
  const initialPlan: EuRepPlanId = isEuRepPlanId(planParam) ? planParam : 'basis';
  const [selectedPlanId, setSelectedPlanId] = useState<EuRepPlanId>(initialPlan);
  const [entity, setEntity] = useState<EntityDraft>(() => readStoredEntity() ?? emptyEntity());
  const [errors, setErrors] = useState<EntityErrors>({});
  const [guestAccount, setGuestAccount] = useState<EuRepGuestAccountDraft>(emptyGuestAccount);
  const [guestErrors, setGuestErrors] = useState<EuRepGuestAccountErrors>({});
  const [guestSubmitCount, setGuestSubmitCount] = useState(0);
  const [activationEmail, setActivationEmail] = useState<string | null>(null);

  const quote = useMemo(() => calculateEuRepQuote(selectedPlanId), [selectedPlanId]);
  const selectedPlanLabel = tPage(`plans.${selectedPlanId}.name`);
  const confirmQuit = hasEntityProgress(entity) || selectedPlanId !== initialPlan;
  const isProcessing =
    createSession.isPending || completeSession.isPending || registerAccount.isPending;

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

  function goToAccount() {
    clearStoredEntity();
    router.push(backFallbackHref);
  }

  function handleShellQuit() {
    clearStoredEntity();
  }

  async function handlePay() {
    const entityResult = validateEntity(entity, tValidation);
    setErrors(entityResult.errors);
    if (!entityResult.ok) return;

    const euRepEntities = [
      {
        legalEntity: entity.legalEntity.trim(),
        forwardingEmail: entity.forwardingEmail.trim(),
        postalLine1: entity.postalLine1.trim(),
        postalLine2: entity.postalLine2?.trim() ?? '',
        postalCode: entity.postalCode.trim(),
        city: entity.city.trim(),
        country: entity.country.trim() || 'Schweiz',
      },
    ];

    if (!isAuthenticated) {
      const accountResult = validateGuestAccount(guestAccount, tValidation);
      setGuestErrors(accountResult.errors);
      setGuestSubmitCount((count) => count + 1);
      if (!accountResult.ok) return;

      try {
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
        setActivationEmail(result.email);
      } catch {
        toast.error(tGuest('registrationFailed'));
      }
      return;
    }

    try {
      toast.info(t('redirecting'));
      const checkoutSession = await createSession.mutateAsync({
        kind: 'euRep',
        euRepPlanId: selectedPlanId,
        euRepEntityCount: 1,
        euRepEntities,
      });
      await new Promise((resolve) => setTimeout(resolve, 900));
      await completeSession.mutateAsync(checkoutSession.id);
      toast.success(t('success'));
      clearStoredEntity();
      goToAccount();
    } catch {
      toast.error(t('failed'));
    }
  }

  const shellProps = {
    serviceLabel: tService('label'),
    quitHref: backFallbackHref,
    onQuit: handleShellQuit,
    faqContent: <ServiceWizardFaqPanel variant="euRep" />,
    confirmQuit,
    cancelTitle: tCancel('title'),
    cancelBody: tCancel('body'),
    cancelQuitLabel: tCancel('quit'),
    cancelProceedLabel: tCancel('proceed'),
  };

  if (isChecking) {
    return (
      <ServiceCheckoutShell {...shellProps}>
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

  if (activationEmail) {
    return (
      <EuRepCheckoutActivation
        email={activationEmail}
        legalEntity={entity.legalEntity}
        planLabel={selectedPlanLabel}
        amount={quote.amountDue}
      />
    );
  }

  return (
    <ServiceCheckoutShell {...shellProps}>
      <StepFrame contentOverflowVisible header={<ServiceCheckoutStepHeader title={t('title')} />}>
        <ServiceCheckoutLayout
          aside={
            <div className="flex flex-col gap-8">
              {!isAuthenticated ? (
                <EuRepCheckoutGuestFields
                  value={guestAccount}
                  errors={guestErrors}
                  submitCount={guestSubmitCount}
                  onChange={(patch) => {
                    setGuestAccount((current) => ({ ...current, ...patch }));
                  }}
                />
              ) : null}
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
                postal={entity}
                onPostalChange={(patch) => {
                  setEntity((current) => ({ ...current, ...patch }));
                }}
                postalErrors={errors}
              />
            </div>
          }
        >
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
            subtotalExclVat={quote.amountDue}
            footerAction={
              <Button
                variant="primary"
                size="lg"
                className="font-display h-14 w-full gap-2 rounded-full text-base"
                onPress={() => {
                  void handlePay();
                }}
                isDisabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" aria-hidden />
                    {t('processing')}
                  </span>
                ) : (
                  <>
                    {isAuthenticated ? t('payCta') : tGuest('payCta')}
                    <CaretRight size={16} weight="bold" aria-hidden />
                  </>
                )}
              </Button>
            }
          />
        </ServiceCheckoutLayout>
      </StepFrame>
    </ServiceCheckoutShell>
  );
}
