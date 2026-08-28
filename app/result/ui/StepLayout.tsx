'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Button,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
} from '@/components/ui';
import { Check, Question } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Logo } from '@/components/shared/Logo';
import { buildResultReturnTo, clearWizardState, type WizardStep } from '@/app/result/wizard-state';

interface StepDef {
  id: string;
  label: string;
}

interface StepLayoutProps {
  step: string;
  domain: string;
  children: ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
  onStepClick?: (stepId: string) => void;
  visitedSteps?: Set<string>;
  visibleStepIds?: string[];
  /** Completed steps that must not be navigated back to (e.g. one-way scan). */
  disabledStepIds?: string[];
  /** Hide the domain + stepper bars — used for the post-config checkout screens. */
  showSteps?: boolean;
  /** Scroll domain + stepper with step content — long questionnaire forms. */
  scrollStepsWithContent?: boolean;
}

export function StepLayout({
  step,
  domain,
  children,
  onStepClick,
  visitedSteps,
  visibleStepIds,
  disabledStepIds,
  showSteps = true,
  scrollStepsWithContent = false,
}: StepLayoutProps) {
  const t = useTranslations('result.steps');
  const tCommon = useTranslations('common');
  const tCancel = useTranslations('result.cancelModal');
  const tGenerator = useTranslations('services.privacyGenerator');
  const router = useRouter();
  const searchParams = useSearchParams();

  const allSteps: StepDef[] = [
    { id: 'scanning', label: t('scanning') },
    { id: 'improved', label: t('questionnaire') },
    { id: 'eu-rep', label: t('euRep') },
    { id: 'summary', label: t('summary') },
  ];

  const steps = visibleStepIds ? allSteps.filter((s) => visibleStepIds.includes(s.id)) : allSteps;

  const indexMap: Record<string, number> = {};
  steps.forEach((s, i) => {
    indexMap[s.id] = i;
  });

  const current = indexMap[step] ?? 0;
  const modal = useOverlayState();

  const stepsChrome = showSteps ? (
    <>
      <div
        className="shrink-0"
        style={{
          background: 'var(--accent)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Container>
          <div
            className="border-r border-l px-4 py-6 sm:px-8 sm:py-8"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <h1 className="truncate text-2xl text-white sm:text-3xl lg:text-4xl">{domain}</h1>
          </div>
        </Container>
      </div>

      <div className="shrink-0" style={{ background: 'var(--accent)' }}>
        <Container>
          <div
            className="flex items-stretch overflow-hidden border-r border-l"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <AnimatePresence initial={false}>
              {steps.map((s, i) => {
                const done = i < current;
                const active = i === current;
                const visited = visitedSteps?.has(s.id) ?? false;
                const clickable =
                  !active && visited && !!onStepClick && !disabledStepIds?.includes(s.id);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`flex flex-1 items-center justify-center gap-3 overflow-hidden border-r px-2 py-4 last:border-r-0 sm:justify-start sm:px-8 sm:py-6 ${clickable ? 'cursor-pointer' : ''}`}
                    onClick={
                      clickable
                        ? () => {
                            onStepClick(s.id);
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
                        className="flex shrink-0 items-center justify-center rounded-full"
                        style={{ width: 28, height: 28, background: 'white' }}
                      >
                        <Check size={14} weight="bold" style={{ color: 'var(--accent)' }} />
                      </div>
                    ) : (
                      <div
                        className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          width: 28,
                          height: 28,
                          background: active ? 'white' : 'transparent',
                          border: active ? 'none' : '1.5px solid rgba(255,255,255,0.35)',
                          color: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {i + 1}
                      </div>
                    )}
                    <span
                      className="hidden text-base font-medium whitespace-nowrap sm:inline"
                      style={{ color: done || active ? 'white' : 'rgba(255,255,255,0.35)' }}
                    >
                      {s.label}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Container>
      </div>
    </>
  ) : null;

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
        <Container>
          <div className="flex items-center border-r border-l border-white/20">
            <div className="flex w-1/2 min-w-0 items-center px-4 py-5 sm:px-8">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  className="inline-flex min-w-0 cursor-pointer items-center rounded-sm border-0 bg-transparent p-0 text-left hover:opacity-90"
                  aria-label={tCancel('title')}
                  onClick={() => {
                    modal.open();
                  }}
                >
                  <Logo />
                </button>
                <div aria-hidden className="h-6 w-px shrink-0 bg-white/20" />
                <span className="font-display flex min-w-0 items-center truncate text-sm leading-none font-medium tracking-tight text-white lowercase">
                  {tGenerator('label')}
                </span>
              </div>
            </div>
            <div className="flex w-1/2 items-center justify-end gap-2 px-4 py-5 sm:gap-3 sm:px-8">
              <LocaleSwitcher />
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
                onPress={() => {
                  const returnTo = buildResultReturnTo(searchParams, step as WizardStep);
                  router.push(`/scan/faq?returnTo=${encodeURIComponent(returnTo)}`);
                }}
              >
                <Question size={16} weight="bold" />
                <span className="hidden sm:inline">{tCommon('faq')}</span>
                <span className="sm:hidden">{tCommon('faqShort')}</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                className="border-white/20 text-white hover:bg-white/10"
                onPress={() => {
                  modal.open();
                }}
              >
                {tCancel('quit')}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Domain + steps — fixed on most steps, scroll with content on long forms */}
      {showSteps && !scrollStepsWithContent ? stepsChrome : null}

      {/* Content */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${scrollStepsWithContent ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {showSteps && scrollStepsWithContent ? stepsChrome : null}
        {children}
      </div>

      {/* Cancel modal */}
      <ModalRoot state={modal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{tCancel('title')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-foreground text-sm leading-relaxed">{tCancel('body')}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  className="text-danger"
                  onPress={() => {
                    clearWizardState();
                    window.location.href = '/';
                  }}
                >
                  {tCancel('quit')}
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    modal.close();
                  }}
                >
                  {tCancel('proceed')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </div>
  );
}
