'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { StepLayout } from './ui/StepLayout';
import { ScanStep } from './steps/ScanStep';
import { ImprovedStep, type ImprovedFormData } from './steps/ImprovedStep';
import { EuRepStep } from './steps/EuRepStep';
import { SummaryStep } from './steps/SummaryStep';

type Step = 'scan' | 'improved' | 'eu-rep' | 'summary';

export default function ResultContent() {
  const params = useSearchParams();
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

  const [step, setStep] = useState<Step>('scan');
  const [formData, setFormData] = useState<ImprovedFormData | undefined>();
  const [scanDone, setScanDone] = useState(false);
  const [includeEuRep, setIncludeEuRep] = useState(false);
  const [euRepPlan, setEuRepPlan] = useState<'budget' | 'standard' | 'premium' | undefined>();
  const [euRepSkipped, setEuRepSkipped] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(new Set(['scan']));

  function goToStep(next: Step) {
    setVisitedSteps((prev) => new Set([...prev, next]));
    setStep(next);
  }

  function handleImprovedSubmit(data: ImprovedFormData) {
    setFormData(data);
    goToStep(includeEuRep ? 'eu-rep' : 'summary');
  }

  function handleEuRepSelect(plan: 'budget' | 'standard' | 'premium') {
    setEuRepPlan(plan);
    setEuRepSkipped(false);
    goToStep('summary');
  }

  function handleEuRepSkip() {
    setEuRepPlan(undefined);
    setEuRepSkipped(true);
    goToStep('summary');
  }

  function handleBack() {
    if (step === 'improved') goToStep('scan');
    else if (step === 'eu-rep') goToStep('improved');
    else if (step === 'summary') {
      goToStep(includeEuRep ? 'eu-rep' : 'improved');
    }
  }

  function handleStepClick(stepId: string) {
    goToStep(stepId as Step);
  }

  const canGoBack = step !== 'scan';

  return (
    <StepLayout
      step={step}
      domain={domain}
      includeEuRep={includeEuRep}
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
              includeEuRep={includeEuRep}
              onIncludeEuRepChange={setIncludeEuRep}
              onContinue={() => {
                setScanDone(true);
                goToStep('improved');
              }}
            />
          )}

          {step === 'improved' && (
            <ImprovedStep
              domain={domain}
              includeEuRep={includeEuRep}
              onSubmit={handleImprovedSubmit}
              onBack={handleBack}
            />
          )}

          {step === 'eu-rep' && (
            <EuRepStep onSelect={handleEuRepSelect} onSkip={handleEuRepSkip} onBack={handleBack} />
          )}

          {step === 'summary' && formData && (
            <SummaryStep
              domain={domain}
              formData={formData}
              includeEuRep={includeEuRep}
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
