'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { StepLayout } from './ui/StepLayout';
import { ScanStep } from './steps/ScanStep';
import { QuestionnaireStep, type QuestionnaireFormData } from './steps/QuestionnaireStep';
import { EuRepStep } from './steps/EuRepStep';
import { SummaryStep } from './steps/SummaryStep';
import { PolicyReadyScreen } from './steps/PolicyReadyScreen';
import { GeneratedPolicyStep } from './steps/GeneratedPolicyStep';
import type { GeneratedDocument } from '@/api/documents';
import { useSession } from '@/api/auth';
import {
  buildVisitedSteps,
  emptyEuRepState,
  isQuestionnaireOnlyMode,
  readWizardState,
  readFillSubscriptionId,
  resolveWizardStep,
  shouldRestoreWizardState,
  shouldShowEuRepStep,
  writeWizardState,
  type EuRepState,
  type WizardProgress,
  type WizardStep,
} from './wizard-state';
import { useRegenerateDocument } from '@/api/documents';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type Step = WizardStep;

/** After Show policy the generated document leaves the wizard. */
type CheckoutPhase = 'wizard' | 'ready';

function buildFallbackPolicy(domain: string, id: string): GeneratedDocument {
  const today = new Date().toISOString().slice(0, 10);
  const year = Number(today.slice(0, 4));
  return {
    id,
    name: 'Privacy Policy',
    site: domain,
    createdDate: today,
    updatedDate: today,
    versions: [{ year, current: true, effectiveDate: today, changeSummary: 'initial' }],
  };
}

function createInitialState(params: URLSearchParams) {
  const questionnaireOnly = isQuestionnaireOnlyMode(params);
  const updateDocumentId = params.get('documentId') ?? undefined;
  const fillSubscriptionId = readFillSubscriptionId(params);
  const stepFromUrl = params.get('step');
  const progress: WizardProgress = {
    scanDone: questionnaireOnly,
    formData: undefined,
    euRep: emptyEuRepState(),
    questionnaireOnly,
    updateDocumentId,
    fillSubscriptionId,
  };
  const step = resolveWizardStep(stepFromUrl, progress);

  return {
    step,
    ...progress,
    visitedSteps: new Set(buildVisitedSteps({ step, ...progress })),
  };
}

function syncVisitedSteps(
  progress: WizardProgress,
  step: Step,
  setVisitedSteps: (value: Set<string>) => void
) {
  setVisitedSteps(new Set(buildVisitedSteps({ step, ...progress })));
}

export default function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tSummary = useTranslations('result.summary');
  const tQuestionnaire = useTranslations('result.questionnaireStep');
  const regenerateDocument = useRegenerateDocument();
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email && session.data.emailVerified);
  const includeAccountStep = !session.isLoading && !isAuthenticated;
  const rawUrl = params.get('url') ?? 'https://mywebsite.ch';

  const domain: string = (() => {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./, '');
    } catch {
      return (
        rawUrl
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0] ?? rawUrl
      );
    }
  })();

  const [initialState] = useState(() => createInitialState(params));
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>(initialState.step);
  const [formData, setFormData] = useState<QuestionnaireFormData | undefined>(
    initialState.formData
  );
  const [scanDone, setScanDone] = useState(initialState.scanDone);
  const [euRep, setEuRep] = useState<EuRepState>(initialState.euRep);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(initialState.visitedSteps);
  const [phase, setPhase] = useState<CheckoutPhase>('wizard');
  const [checkoutDocument, setCheckoutDocument] = useState<GeneratedDocument | undefined>();
  const [questionnaireOnly, setQuestionnaireOnly] = useState(
    initialState.questionnaireOnly ?? false
  );
  const [updateDocumentId, setUpdateDocumentId] = useState(initialState.updateDocumentId);
  const [fillSubscriptionId, setFillSubscriptionId] = useState(initialState.fillSubscriptionId);
  const [confirmReady, setConfirmReady] = useState(Boolean(initialState.confirmReady));

  const progress: WizardProgress = {
    scanDone,
    formData,
    euRep,
    includeAccountStep,
    confirmReady,
    questionnaireOnly,
    updateDocumentId,
    fillSubscriptionId,
  };

  const didHydrate = useRef(false);

  // Mount-only hydration from sessionStorage (survives full page reloads / deep links).
  // Wait for the session so Account vs confirmation is decided without a stepper flicker.
  useEffect(() => {
    if (didHydrate.current || session.isLoading) return;
    didHydrate.current = true;

    const stepParam = params.get('step');
    const requestedStep = stepParam;
    const restored = readWizardState(stepParam);
    const urlQuestionnaireOnly = isQuestionnaireOnlyMode(params);
    const urlUpdateDocumentId = params.get('documentId') ?? undefined;
    const urlFillSubscriptionId = readFillSubscriptionId(params);

    /* eslint-disable react-hooks/set-state-in-effect */
    if (restored && shouldRestoreWizardState(restored, params, domain)) {
      setStep(restored.step);
      if (restored.formData !== undefined) setFormData(restored.formData);
      setScanDone(urlQuestionnaireOnly ? true : restored.scanDone);
      setEuRep(restored.euRep);
      setVisitedSteps(new Set(restored.visitedSteps));
      setQuestionnaireOnly(urlQuestionnaireOnly);
      setUpdateDocumentId(
        urlQuestionnaireOnly ? (urlUpdateDocumentId ?? restored.updateDocumentId) : undefined
      );
      setFillSubscriptionId(urlFillSubscriptionId ?? restored.fillSubscriptionId);

      if (restored.checkoutPhase === 'ready') {
        setPhase('ready');
      }
      if (restored.confirmReady || restored.checkoutPhase === 'confirm') {
        setConfirmReady(true);
      }
      if (restored.checkoutDocumentId) {
        setCheckoutDocument(buildFallbackPolicy(domain, restored.checkoutDocumentId));
      }

      if (requestedStep && restored.step !== requestedStep) {
        syncStepInUrl(restored.step);
      }
    } else {
      const resolvedStep = resolveWizardStep(requestedStep, progress);
      setStep(resolvedStep);
      setFillSubscriptionId(urlFillSubscriptionId);
      syncVisitedSteps(progress, resolvedStep, setVisitedSteps);

      if (requestedStep && resolvedStep !== requestedStep) {
        syncStepInUrl(resolvedStep);
      }
    }

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // progress is intentionally read from the closure on first hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, session.isLoading]);

  // Reconcile the step from the URL against the *in-memory* progress (handles
  // browser back/forward and deep links). Reads live state, never storage, so
  // it cannot clamp back to a stale value mid-navigation.
  useEffect(() => {
    if (!hydrated) return;

    const stepParam = params.get('step');
    const requestedStep = stepParam;
    const resolvedStep = resolveWizardStep(requestedStep, progress);

    /* eslint-disable react-hooks/set-state-in-effect */
    if (resolvedStep !== step) {
      setStep(resolvedStep);
      syncVisitedSteps(progress, resolvedStep, setVisitedSteps);
    }
    if (requestedStep && requestedStep !== resolvedStep) {
      syncStepInUrl(resolvedStep);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, params]);

  useEffect(() => {
    if (!hydrated) return;

    writeWizardState({
      step,
      scanDone,
      formData,
      euRep,
      questionnaireOnly,
      updateDocumentId,
      fillSubscriptionId,
      includeAccountStep,
      confirmReady,
      domain,
      visitedSteps: [...visitedSteps] as WizardStep[],
      checkoutPhase: phase === 'ready' ? 'ready' : confirmReady ? 'confirm' : undefined,
      checkoutDocumentId: checkoutDocument?.id,
    });
  }, [
    hydrated,
    step,
    scanDone,
    formData,
    euRep,
    questionnaireOnly,
    updateDocumentId,
    fillSubscriptionId,
    includeAccountStep,
    confirmReady,
    domain,
    visitedSteps,
    phase,
    checkoutDocument?.id,
  ]);

  useEffect(() => {
    if (!hydrated || session.isLoading || !isAuthenticated) return;
    if (phase !== 'wizard' || step !== 'summary' || !formData) return;
    goToConfirmation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, session.isLoading, isAuthenticated, phase, step, formData]);

  function goToConfirmation(nextProgress: WizardProgress = progress) {
    const next = { ...nextProgress, confirmReady: true };
    setConfirmReady(true);
    advance('confirm', next);
  }

  function syncStepInUrl(next: Step) {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('step', next);
    router.replace(`/result?${nextParams.toString()}`, { scroll: false });
  }

  function advance(next: Step, nextProgress: WizardProgress) {
    const resolvedStep = resolveWizardStep(next, nextProgress);
    syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function goToStep(next: Step) {
    advance(next, progress);
  }

  function handleScanContinue() {
    setScanDone(true);
    advance('questionnaire', { ...progress, scanDone: true });
  }

  function handlePolicyUpdate() {
    if (!questionnaireOnly || !updateDocumentId) return;

    regenerateDocument.mutate(updateDocumentId, {
      onSuccess: () => {
        toast.success(tSummary('updateSuccess'));
        router.push('/account?section=privacyPolicy');
      },
      onError: () => {
        toast.error(tSummary('updateFailed'));
      },
    });
  }

  function handleQuestionnaireSubmit(data: QuestionnaireFormData) {
    setFormData(data);
    const skipEuRep = !shouldShowEuRepStep(data);
    const nextEuRep = skipEuRep ? { done: true, declined: true } : emptyEuRepState();
    setEuRep(nextEuRep);
    const nextProgress = { ...progress, formData: data, euRep: nextEuRep };

    if (questionnaireOnly) {
      if (shouldShowEuRepStep(data)) {
        advance('eu-rep', nextProgress);
      } else {
        handlePolicyUpdate();
      }
      return;
    }

    if (isAuthenticated) {
      goToConfirmation(nextProgress);
      return;
    }

    const target: Step = shouldShowEuRepStep(data) ? 'eu-rep' : 'summary';
    advance(target, nextProgress);
  }

  function handleEuRepComplete(next: EuRepState) {
    setEuRep(next);
    const nextProgress = { ...progress, euRep: next };

    if (questionnaireOnly) {
      handlePolicyUpdate();
      return;
    }

    if (isAuthenticated) {
      goToConfirmation(nextProgress);
      return;
    }

    advance('summary', nextProgress);
  }

  function handleScanAgain() {
    setScanDone(false);
    advance('scanning', { ...progress, scanDone: false });
  }

  function handleBack() {
    if (step === 'questionnaire') {
      if (questionnaireOnly) {
        router.push('/account?section=privacyPolicy');
      }
      return;
    }
    if (step === 'eu-rep') goToStep('questionnaire');
    else if (step === 'summary' || step === 'confirm') {
      goToStep(
        includeAccountStep && step === 'confirm'
          ? 'summary'
          : shouldShowEuRepStep(formData)
            ? 'eu-rep'
            : 'questionnaire'
      );
    }
  }

  const policyAlreadyGenerated = Boolean(checkoutDocument);

  if (!hydrated) {
    return (
      <StepLayout step={step} domain={domain}>
        <div className="flex flex-1 items-center justify-center" />
      </StepLayout>
    );
  }

  if (phase === 'ready' && checkoutDocument) {
    return <GeneratedPolicyStep document={checkoutDocument} />;
  }

  return (
    <StepLayout
      step={step}
      domain={domain}
      scrollStepsWithContent={step === 'questionnaire'}
      quitDisabled={step === 'confirm' && policyAlreadyGenerated}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex min-h-0 flex-1 flex-col${step === 'questionnaire' ? '' : 'h-full'}`}
        >
          {step === 'scanning' && (
            <ScanStep domain={domain} skipLoading={scanDone} onContinue={handleScanContinue} />
          )}

          {step === 'questionnaire' && (
            <QuestionnaireStep
              domain={domain}
              initialData={formData}
              onSubmit={handleQuestionnaireSubmit}
              onBack={questionnaireOnly ? handleBack : handleScanAgain}
              backLabel={questionnaireOnly ? undefined : tQuestionnaire('scanAgain')}
            />
          )}

          {step === 'eu-rep' && formData && (
            <EuRepStep formData={formData} onComplete={handleEuRepComplete} onBack={handleBack} />
          )}

          {step === 'summary' && formData && (
            <SummaryStep
              domain={domain}
              formData={formData}
              euRep={euRep}
              fillSubscriptionId={fillSubscriptionId}
              onBack={handleBack}
            />
          )}

          {step === 'confirm' && (
            <PolicyReadyScreen
              domain={domain}
              formData={formData}
              euRep={euRep}
              fillSubscriptionId={fillSubscriptionId}
              document={checkoutDocument}
              onShowPolicy={(document) => {
                setCheckoutDocument(document);
                setPhase('ready');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StepLayout>
  );
}
