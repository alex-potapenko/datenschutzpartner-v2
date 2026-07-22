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
import { X, Check } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Logo } from '@/components/shared/Logo';
import { buildResultReturnTo, type WizardStep } from '@/app/result/wizard-state';

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
  /** Hide the domain + stepper bars — used for the post-config checkout screens. */
  showSteps?: boolean;
}

export function StepLayout({
  step,
  domain,
  children,
  onStepClick,
  visitedSteps,
  visibleStepIds,
  showSteps = true,
}: StepLayoutProps) {
  const t = useTranslations('result.steps');
  const tCommon = useTranslations('common');
  const tCancel = useTranslations('result.cancelModal');
  const router = useRouter();
  const searchParams = useSearchParams();

  const allSteps: StepDef[] = [
    { id: 'scan', label: t('scan') },
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

  return (
    <div className="bg-background flex min-h-dvh flex-1 flex-col">
      {/* Top bar */}
      <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
        <Container>
          <div className="flex items-stretch border-r border-l border-white/20">
            <div className="flex w-1/2 min-w-0 items-center px-4 py-4 sm:px-8 sm:py-5">
              <Logo markClassName="size-[22px]" />
            </div>
            <div className="flex w-1/2 items-center justify-end gap-2 px-4 py-4 sm:gap-3 sm:px-8 sm:py-5">
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
                <span className="hidden sm:inline">{tCommon('faq')}</span>
                <span className="sm:hidden">{tCommon('faqShort')}</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
                onPress={() => {
                  modal.open();
                }}
              >
                <X size={16} weight="bold" />
                <span className="hidden sm:inline">{tCommon('cancel')}</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Domain name */}
      {showSteps ? (
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

          {/* Steps bar */}
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
                    const clickable = !active && visited && !!onStepClick;
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
      ) : null}

      {/* Content */}
      <div className="flex flex-1 flex-col">{children}</div>

      {/* Cancel modal */}
      <ModalRoot state={modal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{tCancel('title')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-muted text-sm">{tCancel('body')}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  className="text-danger"
                  onPress={() => {
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
