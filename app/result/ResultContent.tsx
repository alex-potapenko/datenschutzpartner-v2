'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { StepLayout } from './ui/StepLayout';
import { ScanStep } from './steps/ScanStep';
import { ImprovedStep, type ImprovedFormData } from './steps/ImprovedStep';
import { EuRepStep } from './steps/EuRepStep';
import { SummaryStep } from './steps/SummaryStep';
import {
  buildVisitedSteps,
  isWizardStep,
  readWizardState,
  resolveWizardStep,
  writeWizardState,
  type WizardProgress,
  type WizardStep,
} from './wizard-state';

type Step = WizardStep;

function createInitialState(params: URLSearchParams) {
  const stepFromUrl = params.get('step');
  const progress: WizardProgress = {
    scanDone: false,
    formData: undefined,
    euRepPlan: undefined,
    euRepSkipped: false,
  };
  const step = resolveWizardStep(isWizardStep(stepFromUrl) ? stepFromUrl : null, progress);

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
  const [formData, setFormData] = useState<ImprovedFormData | undefined>(initialState.formData);
  const [scanDone, setScanDone] = useState(initialState.scanDone);
  const [euRepPlan, setEuRepPlan] = useState<'budget' | 'standard' | 'premium' | undefined>(
    initialState.euRepPlan
  );
  const [euRepSkipped, setEuRepSkipped] = useState(initialState.euRepSkipped);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(initialState.visitedSteps);

  const progress: WizardProgress = { scanDone, formData, euRepPlan, euRepSkipped };

  useEffect(() => {
    const restored = readWizardState(params.get('step'));
    const stepParam = params.get('step');
    const requestedStep = isWizardStep(stepParam) ? stepParam : null;

    /* eslint-disable react-hooks/set-state-in-effect */
    if (restored) {
      setStep(restored.step);
      if (restored.formData !== undefined) setFormData(restored.formData);
      setScanDone(restored.scanDone);
      setEuRepPlan(restored.euRepPlan);
      setEuRepSkipped(restored.euRepSkipped);
      setVisitedSteps(new Set(restored.visitedSteps));

      if (requestedStep && restored.step !== requestedStep) {
        const nextParams = new URLSearchParams(params.toString());
        nextParams.set('step', restored.step);
        router.replace(`/result?${nextParams.toString()}`, { scroll: false });
      }
    } else {
      const resolvedStep = resolveWizardStep(requestedStep, progress);
      setStep(resolvedStep);
      syncVisitedSteps(progress, resolvedStep, setVisitedSteps);

      if (requestedStep && resolvedStep !== requestedStep) {
        const nextParams = new URLSearchParams(params.toString());
        nextParams.set('step', resolvedStep);
        router.replace(`/result?${nextParams.toString()}`, { scroll: false });
      }
    }

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // progress is intentionally read from the closure on first hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (!hydrated) return;

    writeWizardState({
      step,
      scanDone,
      formData,
      euRepPlan,
      euRepSkipped,
      visitedSteps: [...visitedSteps] as WizardStep[],
    });
  }, [hydrated, step, scanDone, formData, euRepPlan, euRepSkipped, visitedSteps]);

  function syncStepInUrl(next: Step) {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set('step', next);
    router.replace(`/result?${nextParams.toString()}`, { scroll: false });
  }

  function goToStep(next: Step) {
    const resolvedStep = resolveWizardStep(next, progress);
    syncVisitedSteps(progress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function handleImprovedSubmit(data: ImprovedFormData) {
    setFormData(data);
    const nextProgress = { ...progress, formData: data };
    const resolvedStep = resolveWizardStep('eu-rep', nextProgress);
    syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function handleEuRepSelect(plan: 'budget' | 'standard' | 'premium') {
    setEuRepPlan(plan);
    setEuRepSkipped(false);
    const nextProgress = { ...progress, euRepPlan: plan, euRepSkipped: false };
    const resolvedStep = resolveWizardStep('summary', nextProgress);
    syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function handleEuRepSkip() {
    setEuRepPlan(undefined);
    setEuRepSkipped(true);
    const nextProgress = { ...progress, euRepPlan: undefined, euRepSkipped: true };
    const resolvedStep = resolveWizardStep('summary', nextProgress);
    syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
    setStep(resolvedStep);
    syncStepInUrl(resolvedStep);
  }

  function handleBack() {
    if (step === 'improved') goToStep('scan');
    else if (step === 'eu-rep') goToStep('improved');
    else if (step === 'summary') goToStep('eu-rep');
  }

  function handleStepClick(stepId: string) {
    if (!isWizardStep(stepId)) return;
    goToStep(stepId);
  }

  const canGoBack = step !== 'scan';

  return (
    <StepLayout
      step={step}
      domain={domain}
      canGoBack={canGoBack}
      onBack={handleBack}
      onStepClick={handleStepClick}
      visitedSteps={visitedSteps}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-1 flex-col"
        >
          {step === 'scan' && (
            <ScanStep
              domain={domain}
              skipLoading={scanDone}
              onContinue={() => {
                setScanDone(true);
                const nextProgress = { ...progress, scanDone: true };
                const resolvedStep = resolveWizardStep('improved', nextProgress);
                syncVisitedSteps(nextProgress, resolvedStep, setVisitedSteps);
                setStep(resolvedStep);
                syncStepInUrl(resolvedStep);
              }}
            />
          )}

          {step === 'improved' && (
            <ImprovedStep domain={domain} onSubmit={handleImprovedSubmit} onBack={handleBack} />
          )}

          {step === 'eu-rep' && (
            <EuRepStep onSelect={handleEuRepSelect} onSkip={handleEuRepSkip} onBack={handleBack} />
          )}

          {step === 'summary' && formData && (
            <SummaryStep
              domain={domain}
              formData={formData}
              euRepPlan={euRepPlan}
              euRepSkipped={euRepSkipped}
              onPreview={() => {}}
              onBack={handleBack}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StepLayout>
  );
}
