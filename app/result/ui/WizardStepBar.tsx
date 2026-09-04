'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Check } from '@/components/ui';
import { Container } from '@/components/shared/Container';

export const WIZARD_STEP_BAR_IDS = ['scanning', 'questionnaire', 'eu-rep', 'account'] as const;
export type WizardStepBarId = (typeof WIZARD_STEP_BAR_IDS)[number];

type WizardStepBarProps = {
  currentStepId: WizardStepBarId;
  visitedSteps?: Set<string>;
  disabledStepIds?: string[];
  onStepClick?: (stepId: WizardStepBarId) => void;
  /** Fourth step — guest account creation before confirmation. */
  showAccountStep?: boolean;
  /** Hide EU-rep when questionnaire answers do not require it. */
  showEuRepStep?: boolean;
};

export function toWizardStepBarId(step: string): WizardStepBarId {
  if (step === 'website') return 'scanning';
  if (step === 'questionnaire') return 'questionnaire';
  if (step === 'eu-rep') return 'eu-rep';
  if (step === 'summary') return 'account';
  if (step === 'scanning') return 'scanning';
  return 'scanning';
}

export function WizardStepBar({
  currentStepId,
  visitedSteps,
  disabledStepIds,
  onStepClick,
  showAccountStep = false,
  showEuRepStep = true,
}: WizardStepBarProps) {
  const t = useTranslations('result.steps');

  const steps = [
    { id: 'scanning' as const, label: t('scanning') },
    { id: 'questionnaire' as const, label: t('questionnaire') },
    ...(showEuRepStep ? [{ id: 'eu-rep' as const, label: t('euRep') }] : []),
    ...(showAccountStep ? [{ id: 'account' as const, label: t('confirmation') }] : []),
  ];

  const current = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="shrink-0" style={{ background: 'var(--accent)' }}>
      <Container>
        <div
          className="flex items-stretch overflow-hidden border-r border-l"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <AnimatePresence initial={false}>
            {steps.map((step, index) => {
              const done = index < current;
              const active = index === current;
              const visited =
                visitedSteps?.has(step.id) ||
                (step.id === 'account' && (visitedSteps?.has('summary') ?? false)) ||
                (step.id === 'scanning' && (visitedSteps?.has('website') ?? false));
              const disabled = disabledStepIds?.includes(step.id) ?? false;
              const clickable = !active && visited && !disabled && Boolean(onStepClick);

              return (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className={`flex flex-1 items-center justify-center gap-3 overflow-hidden border-r px-2 py-4 last:border-r-0 sm:justify-start sm:px-8 sm:py-6 ${clickable ? 'cursor-pointer' : ''}`}
                  onClick={
                    clickable
                      ? () => {
                          onStepClick?.(step.id);
                        }
                      : undefined
                  }
                  style={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderTop: active || done ? '3px solid white' : '3px solid transparent',
                  }}
                >
                  {done ? (
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white"
                      aria-hidden
                    >
                      <Check size={14} weight="bold" style={{ color: 'var(--accent)' }} />
                    </div>
                  ) : (
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: active ? 'white' : 'transparent',
                        border: active ? 'none' : '1.5px solid rgba(255,255,255,0.35)',
                        color: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                      }}
                      aria-hidden
                    >
                      {index + 1}
                    </div>
                  )}
                  <span
                    className="hidden text-base font-medium whitespace-nowrap sm:inline"
                    style={{ color: done || active ? 'white' : 'rgba(255,255,255,0.35)' }}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
}
