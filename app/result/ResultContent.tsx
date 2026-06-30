'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { StepLayout } from './ui/StepLayout';
import { ScanStep } from './steps/ScanStep';
import { DecisionStep } from './steps/DecisionStep';
import { ImprovedStep, type ImprovedFormData } from './steps/ImprovedStep';
import { EuRepStep } from './steps/EuRepStep';
import { SummaryStep } from './steps/SummaryStep';

type Step = 'scan' | 'decision' | 'improved' | 'eu-rep' | 'summary';

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
  const [path, setPath] = useState<'basic' | 'improved'>('basic');
  const [formData, setFormData] = useState<ImprovedFormData | undefined>();
  const [scanDone, setScanDone] = useState(false);
  const [includeEuRep, setIncludeEuRep] = useState(false);
  const [euRepPlan, setEuRepPlan] = useState<'budget' | 'standard' | 'premium' | undefined>();
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
    goToStep('summary');
  }

  function handleBack() {
    if (step === 'decision') goToStep('scan');
    else if (step === 'improved') goToStep('decision');
    else if (step === 'eu-rep') goToStep(path === 'improved' ? 'improved' : 'decision');
    else if (step === 'summary') {
      if (includeEuRep) goToStep('eu-rep');
      else goToStep(path === 'improved' ? 'improved' : 'decision');
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
      path={path}
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
                goToStep('decision');
              }}
            />
          )}

          {step === 'decision' && (
            <DecisionStep
              onBasic={() => {
                setPath('basic');
                goToStep('summary');
              }}
              onImproved={() => {
                setPath('improved');
                goToStep('improved');
              }}
              onBack={handleBack}
            />
          )}

          {step === 'improved' && (
            <ImprovedStep domain={domain} onSubmit={handleImprovedSubmit} onBack={handleBack} />
          )}

          {step === 'eu-rep' && <EuRepStep onSelect={handleEuRepSelect} onBack={handleBack} />}

          {step === 'summary' && (
            <SummaryStep
              domain={domain}
              formData={formData}
              path={path}
              includeEuRep={includeEuRep}
              euRepPlan={euRepPlan}
              onPreview={() => {}}
              onBack={handleBack}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </StepLayout>
  );
}
