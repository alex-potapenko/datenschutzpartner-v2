'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { StepLayout } from './ui/StepLayout';
import type { WizardStepBarId } from './ui/WizardStepBar';
import { WebsiteStep } from './steps/WebsiteStep';
import { ScanStep } from './steps/ScanStep';
import { QuestionnaireStep, type QuestionnaireFormData } from './steps/QuestionnaireStep';
import { EuRepStep } from './steps/EuRepStep';
import { SummaryStep } from './steps/SummaryStep';
import { AccountActivationScreen } from './steps/AccountActivationScreen';
import { type GeneratedDocument } from '@/api/documents';
import { useSession } from '@/api/auth';
import {
  buildVisitedSteps,
  emptyEuRepState,
  isQuestionnaireOnlyMode,
  mergeEuRepIntoFormData,
  readWizardState,
  readFillSubscriptionId,
  hasWebsiteUrlParam,
  resolveWizardStep,
  shouldResetIncompleteScan,
  shouldRestoreWizardState,
  shouldShowEuRepStep,
  skippedEuRepState,
  hasWizardUserProgress,
  writeWizardState,
  clearWizardState,
  type EuRepState,
  type WizardProgress,
  type WizardStep,
} from './wizard-state';
import { privacyPolicyAccountHref, safeAccountReturnTo } from '@/lib/account-routes';
import { useRegenerateDocument } from '@/api/documents';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type Step = WizardStep;

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
    hasWebsiteUrl: hasWebsiteUrlParam(params),
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
  const tLanding = useTranslations('landing');
  const regenerateDocument = useRegenerateDocument();
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email && session.data.emailVerified);
  /** Guests need Account. While the session is still loading, keep the guest path
   *  so we do not skip registration and dump an anonymous user on confirmation. */
  const includeAccountStep = !isAuthenticated;
  const rawUrl = params.get('url')?.trim() ?? '';
  const hasWebsiteUrl = hasWebsiteUrlParam(params);
  const returnTo = safeAccountReturnTo(params.get('returnTo'));
  const quitHref = returnTo ?? '/';

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
  const [checkoutDocument, setCheckoutDocument] = useState<GeneratedDocument | undefined>();
  const [questionnaireOnly, setQuestionnaireOnly] = useState(
    initialState.questionnaireOnly ?? false
  );
  const [updateDocumentId, setUpdateDocumentId] = useState(initialState.updateDocumentId);
  const [fillSubscriptionId, setFillSubscriptionId] = useState(initialState.fillSubscriptionId);
  const [confirmReady, setConfirmReady] = useState(Boolean(initialState.confirmReady));
  const [websiteInput, setWebsiteInput] = useState('');
  const [activation, setActivation] = useState<{
    email: string;
    verificationUrl?: string | null;
  } | null>(null);

  const progress: WizardProgress = {
    scanDone,
    formData,
    euRep,
    includeAccountStep,
    confirmReady,
    questionnaireOnly,
    updateDocumentId,
    fillSubscriptionId,
    hasWebsiteUrl,
  };

  const didHydrate = useRef(false);
  const resetIncompleteScanRef = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

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
    const restoredScanDone = Boolean(
      restored && shouldRestoreWizardState(restored, params, domain) && restored.scanDone
    );

    /* eslint-disable react-hooks/set-state-in-effect */
    if (shouldResetIncompleteScan(requestedStep, restoredScanDone, urlQuestionnaireOnly)) {
      resetIncompleteScanRef.current = true;
      clearWizardState();
      setStep('website');
      setScanDone(false);
      setFillSubscriptionId(urlFillSubscriptionId);
      const nextParams = new URLSearchParams(params.toString());
      nextParams.delete('url');
      nextParams.set('step', 'website');
      router.replace(`/result?${nextParams.toString()}`, { scroll: false });
      setHydrated(true);
      return;
    }

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
        clearWizardState();
        router.replace(privacyPolicyAccountHref({ site: domain, tab: 'preview' }));
        setHydrated(true);
        return;
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

    if (resetIncompleteScanRef.current) {
      const urlCleared = !params.get('url')?.trim() && stepParam === 'website';
      if (urlCleared) {
        resetIncompleteScanRef.current = false;
      } else {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (step !== 'website') setStep('website');
        const nextParams = new URLSearchParams(params.toString());
        nextParams.delete('url');
        nextParams.set('step', 'website');
        router.replace(`/result?${nextParams.toString()}`, { scroll: false });
        /* eslint-enable react-hooks/set-state-in-effect */
        return;
      }
    }

    const resolvedStep = resolveWizardStep(requestedStep, progressRef.current);

     
    if (resolvedStep !== step) {
      setStep(resolvedStep);
      syncVisitedSteps(progress, resolvedStep, setVisitedSteps);
    }
    if (requestedStep && requestedStep !== resolvedStep) {
      syncStepInUrl(resolvedStep);
    }
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, params, confirmReady, euRep, formData, scanDone, includeAccountStep, questionnaireOnly]);

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
      checkoutPhase: confirmReady ? 'confirm' : undefined,
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
    checkoutDocument?.id,
  ]);

  useEffect(() => {
    if (!hydrated || session.isLoading || !isAuthenticated) return;
    if (step !== 'summary' || !formData) return;
    goToConfirmation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, session.isLoading, isAuthenticated, step, formData]);

  function goToConfirmation(nextProgress: WizardProgress = progress) {
    const next = { ...nextProgress, confirmReady: true };
    progressRef.current = next;
    flushSync(() => {
      setConfirmReady(true);
      setEuRep(next.euRep);
      if (next.formData !== undefined) setFormData(next.formData);
    });
    advance('confirm', next);
  }

  function syncStepInUrl(next: Step) {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('step', next);
    router.replace(`/result?${nextParams.toString()}`, { scroll: false });
  }

  function advance(next: Step, nextProgress: WizardProgress) {
    progressRef.current = nextProgress;
    const resolvedStep = resolveWizardStep(next, nextProgress);
    syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function goToStep(next: Step) {
    advance(next, progress);
  }

  function handleWebsiteUrlSubmit(normalizedUrl: string) {
    const nextProgress = { ...progress, hasWebsiteUrl: true };
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('url', normalizedUrl);
    nextParams.set('step', 'scanning');
    syncVisitedSteps(nextProgress, 'scanning', setVisitedSteps);
    setStep('scanning');
    router.replace(`/result?${nextParams.toString()}`, { scroll: false });
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
        clearWizardState();
        router.push(privacyPolicyAccountHref({ site: domain, tab: 'preview' }));
      },
      onError: () => {
        toast.error(tSummary('updateFailed'));
      },
    });
  }

  function handleQuestionnaireSubmit(data: QuestionnaireFormData) {
    const showEuRep = shouldShowEuRepStep(data);
    const nextEuRep = showEuRep ? emptyEuRepState() : skippedEuRepState();
    const mergedFormData = showEuRep ? data : mergeEuRepIntoFormData(data, nextEuRep);

    setFormData(mergedFormData);
    setEuRep(nextEuRep);
    const nextProgress = { ...progress, formData: mergedFormData, euRep: nextEuRep };

    if (!showEuRep) {
      if (questionnaireOnly) {
        advance('questionnaire', nextProgress);
        handlePolicyUpdate();
        return;
      }

      if (isAuthenticated) {
        goToConfirmation(nextProgress);
        return;
      }

      advance('summary', nextProgress);
      return;
    }

    advance('eu-rep', nextProgress);
  }

  function handleEuRepComplete(next: EuRepState, updatedFormData: QuestionnaireFormData) {
    const nextProgress = { ...progress, euRep: next, formData: updatedFormData };

    if (questionnaireOnly) {
      setEuRep(next);
      setFormData(updatedFormData);
      handlePolicyUpdate();
      return;
    }

    if (isAuthenticated) {
      goToConfirmation(nextProgress);
      return;
    }

    setEuRep(next);
    setFormData(updatedFormData);
    advance('summary', nextProgress);
  }

  function handleScanAgain() {
    setScanDone(false);
    advance('scanning', { ...progress, scanDone: false });
  }

  function handleBack() {
    if (step === 'website') {
      router.push(quitHref);
      return;
    }
    if (step === 'questionnaire') {
      if (questionnaireOnly) {
        router.push(returnTo ?? privacyPolicyAccountHref({ site: domain || undefined }));
      }
      return;
    }
    if (step === 'eu-rep') goToStep('questionnaire');
    else if (step === 'summary' || step === 'confirm') {
      const previousStep =
        includeAccountStep && step === 'confirm'
          ? 'summary'
          : formData && shouldShowEuRepStep(formData)
            ? 'eu-rep'
            : 'questionnaire';
      goToStep(previousStep);
    }
  }

  function handleStepClick(stepId: WizardStepBarId) {
    if (stepId === 'scanning') {
      if (scanDone && !questionnaireOnly) return;
      goToStep(!hasWebsiteUrl && !questionnaireOnly ? 'website' : 'scanning');
      return;
    }
    if (stepId === 'questionnaire') {
      goToStep('questionnaire');
      return;
    }
    if (stepId === 'eu-rep' && formData && shouldShowEuRepStep(formData)) {
      goToStep('eu-rep');
      return;
    }
    if (stepId === 'account' && formData && euRep.done) {
      goToStep('summary');
    }
  }

  const showAccountStepInBar = includeAccountStep && !questionnaireOnly;
  const showEuRepStepInBar = Boolean(formData && shouldShowEuRepStep(formData));
  const showStepBar = step !== 'confirm' && (showAccountStepInBar || step !== 'summary');
  const showQuit = step !== 'confirm';
  const showWebsiteInputHeader = step === 'website' && Boolean(returnTo);
  const websiteHeaderText = websiteInput.trim() || tLanding('scanPlaceholder');
  const disabledStepIds = [
    ...(questionnaireOnly || (scanDone && !questionnaireOnly) ? ['scanning'] : []),
    ...(showAccountStepInBar && !euRep.done ? ['account'] : []),
  ];
  const disabledStepBarIds = disabledStepIds.length > 0 ? disabledStepIds : undefined;

  const policyAlreadyGenerated = Boolean(checkoutDocument);
  const confirmQuit = hasWizardUserProgress(progress);

  useEffect(() => {
    if (step !== 'website') {
      setWebsiteInput('');
    }
  }, [step]);

  if (!hydrated) {
    return (
      <StepLayout
        step={step}
        domain={domain}
        hideDomain={step === 'website' && !showWebsiteInputHeader}
        domainHeader={showWebsiteInputHeader ? websiteHeaderText : undefined}
        domainHeaderPlaceholder={showWebsiteInputHeader && !websiteInput.trim()}
        quitHref={quitHref}
        confirmQuit={confirmQuit}
        showStepBar={showStepBar}
        showAccountStepInBar={showAccountStepInBar}
        showEuRepStepInBar={showEuRepStepInBar}
        visitedSteps={visitedSteps}
        disabledStepIds={disabledStepBarIds}
        onStepClick={handleStepClick}
        showQuit={showQuit}
      >
        <div className="flex flex-1 items-center justify-center" />
      </StepLayout>
    );
  }

  if (activation) {
    return (
      <AccountActivationScreen
        variant="activation"
        email={activation.email}
        domain={domain}
        euRep={euRep}
        fillSubscriptionId={fillSubscriptionId}
      />
    );
  }

  if (step === 'confirm') {
    return (
      <AccountActivationScreen
        variant="policyReady"
        domain={domain}
        euRep={euRep}
        fillSubscriptionId={fillSubscriptionId}
        formData={formData}
        document={checkoutDocument}
      />
    );
  }

  return (
    <StepLayout
      step={step}
      domain={domain}
      hideDomain={step === 'website' && !showWebsiteInputHeader}
      domainHeader={showWebsiteInputHeader ? websiteHeaderText : undefined}
      domainHeaderPlaceholder={showWebsiteInputHeader && !websiteInput.trim()}
      quitHref={quitHref}
      scrollStepsWithContent={step === 'questionnaire' || step === 'eu-rep' || step === 'summary'}
      quitDisabled={false}
      confirmQuit={confirmQuit}
      showStepBar={showStepBar}
      showAccountStepInBar={showAccountStepInBar}
      showEuRepStepInBar={showEuRepStepInBar}
      visitedSteps={visitedSteps}
      disabledStepIds={disabledStepBarIds}
      onStepClick={handleStepClick}
      showQuit={showQuit}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`flex flex-col${step === 'questionnaire' || step === 'eu-rep' ? 'flex-1' : ''}${step !== 'questionnaire' && step !== 'eu-rep' ? 'h-full min-h-0 flex-1' : ''}`}
        >
          {step === 'website' && (
            <WebsiteStep
              onUrlSubmit={handleWebsiteUrlSubmit}
              onUrlChange={setWebsiteInput}
              autoFocus={showWebsiteInputHeader}
            />
          )}
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
            <EuRepStep
              formData={formData}
              initialEuRep={euRep}
              onComplete={handleEuRepComplete}
              onBack={handleBack}
            />
          )}

          {step === 'summary' && formData && (
            <SummaryStep
              domain={domain}
              formData={formData}
              euRep={euRep}
              fillSubscriptionId={fillSubscriptionId}
              onBack={handleBack}
              onRegistered={setActivation}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StepLayout>
  );
}
