'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
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
import { Question } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Logo } from '@/components/shared/Logo';
import { buildResultReturnTo, clearWizardState, type WizardStep } from '@/app/result/wizard-state';

interface StepLayoutProps {
  step: string;
  domain: string;
  children: ReactNode;
  /** Scroll the domain bar with step content — long questionnaire forms. */
  scrollStepsWithContent?: boolean;
  /** Lock the wizard exit once the hosted policy already exists. */
  quitDisabled?: boolean;
}

export function StepLayout({
  step,
  domain,
  children,
  scrollStepsWithContent = false,
  quitDisabled = false,
}: StepLayoutProps) {
  const tCommon = useTranslations('common');
  const tCancel = useTranslations('result.cancelModal');
  const tGenerator = useTranslations('services.privacyGenerator');
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = useOverlayState();

  const domainChrome = (
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
  );

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <div className="shrink-0 text-white" style={{ background: 'var(--accent)' }}>
        <Container>
          <div className="flex items-center border-r border-l border-white/20">
            <div className="flex w-1/2 min-w-0 items-center px-4 py-5 sm:px-8">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  className={`inline-flex min-w-0 items-center rounded-sm border-0 bg-transparent p-0 text-left ${
                    quitDisabled ? 'cursor-default opacity-60' : 'cursor-pointer hover:opacity-90'
                  }`}
                  aria-label={tCancel('title')}
                  disabled={quitDisabled}
                  onClick={() => {
                    if (quitDisabled) return;
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
                isDisabled={quitDisabled}
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

      {!scrollStepsWithContent ? domainChrome : null}

      <div
        className={`flex min-h-0 flex-1 flex-col ${scrollStepsWithContent ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {scrollStepsWithContent ? domainChrome : null}
        {children}
      </div>

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
                  isDisabled={quitDisabled}
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
