'use client';

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
import { Logo } from '@/components/shared/Logo';

interface StepDef {
  id: string;
  label: string;
}

interface StepLayoutProps {
  step: string;
  domain: string;
  path: 'basic' | 'improved';
  includeEuRep?: boolean;
  children: ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
  onStepClick?: (stepId: string) => void;
  visitedSteps?: Set<string>;
}

export function StepLayout({
  step,
  domain,
  path,
  includeEuRep,
  children,
  onStepClick,
  visitedSteps,
}: StepLayoutProps) {
  const steps: StepDef[] = [
    { id: 'scan', label: 'Scan' },
    { id: 'decision', label: 'Privacy Policy Setup' },
    ...(path === 'improved' ? [{ id: 'improved', label: 'Questionnaire' }] : []),
    ...(includeEuRep ? [{ id: 'eu-rep', label: 'EU Representative' }] : []),
    { id: 'summary', label: 'Review' },
  ];

  const indexMap: Record<string, number> = {};
  steps.forEach((s, i) => {
    indexMap[s.id] = i;
  });

  const current = indexMap[step] ?? 0;
  const modal = useOverlayState();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
        <Container>
          <div className="flex items-stretch border-r border-l border-white/20">
            <div className="flex w-1/2 items-center px-8 py-5">
              <Logo height={22} />
            </div>
            <div className="flex w-1/2 items-center justify-end px-8 py-5">
              <Button
                variant="outline"
                size="md"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
                onPress={() => { modal.open(); }}
              >
                <X size={16} weight="bold" />
                Cancel
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Domain name */}
      <div
        className="shrink-0"
        style={{ background: 'var(--accent)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
      >
        <Container>
          <div
            className="border-r border-l px-8 py-8"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <h1 className="text-5xl text-white">{domain}</h1>
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
                    className={`flex flex-1 items-center gap-3 overflow-hidden border-r px-8 py-6 last:border-r-0 ${clickable ? 'cursor-pointer' : ''}`}
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
                      className="text-base font-medium whitespace-nowrap"
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

      {/* Content */}
      <div className="flex flex-1 flex-col">{children}</div>

      {/* Cancel modal */}
      <ModalRoot state={modal}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>Cancel generation?</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-muted text-sm">
                  Your progress will be lost. Are you sure you want to leave?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  className="text-danger"
                  onPress={() => {
                    window.location.href = '/';
                  }}
                >
                  Quit Generator
                </Button>
                <Button variant="primary" onPress={() => { modal.close(); }}>
                  Proceed Working
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </div>
  );
}
