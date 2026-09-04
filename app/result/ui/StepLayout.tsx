'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/shared/Container';
import { ServiceWizardShell } from '@/components/shared/ServiceWizardShell';
import { ServiceWizardFaqPanel } from '@/components/shared/ServiceWizardFaqPanel';
import { cn } from '@/lib/utils';
import { clearWizardState } from '@/app/result/wizard-state';
import { StepLayoutFooterContextProvider } from './StepLayoutFooter';
import { WizardStepBar, toWizardStepBarId, type WizardStepBarId } from './WizardStepBar';

interface StepLayoutProps {
  step: string;
  domain: string;
  children: ReactNode;
  /** Hide the domain bar — website-input step has no site yet. */
  hideDomain?: boolean;
  /** Accent header text — e.g. live website input while adding a site from the account. */
  domainHeader?: string;
  /** Muted header style for placeholder copy before the user types. */
  domainHeaderPlaceholder?: boolean;
  /** Where Quit sends the user. Defaults to the marketing home. */
  quitHref?: string;
  /** Scroll the domain bar with step content — long questionnaire forms. */
  scrollStepsWithContent?: boolean;
  /** Lock the wizard exit once the hosted policy already exists. */
  quitDisabled?: boolean;
  /** When false, Quit leaves immediately without the cancel modal. */
  confirmQuit?: boolean;
  /** Show the three-step progress bar (scanning → questionnaire → eu-rep). */
  showStepBar?: boolean;
  /** Add the guest account step to the progress bar. */
  showAccountStepInBar?: boolean;
  /** Hide EU-rep in the progress bar when it does not apply. */
  showEuRepStepInBar?: boolean;
  visitedSteps?: Set<string>;
  disabledStepIds?: string[];
  onStepClick?: (stepId: WizardStepBarId) => void;
  /** Hide Quit on the left — e.g. policy ready screen. */
  showQuit?: boolean;
}

export function StepLayout({
  step,
  domain,
  children,
  hideDomain = false,
  domainHeader,
  domainHeaderPlaceholder = false,
  quitHref = '/',
  scrollStepsWithContent = false,
  quitDisabled = false,
  confirmQuit = true,
  showStepBar = true,
  showAccountStepInBar = false,
  showEuRepStepInBar = true,
  visitedSteps,
  disabledStepIds,
  onStepClick,
  showQuit = true,
}: StepLayoutProps) {
  const tCommon = useTranslations('common');
  const tCancel = useTranslations('result.cancelModal');
  const tGenerator = useTranslations('services.privacyGenerator');
  const [layoutFooter, setLayoutFooter] = useState<ReactNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [step]);

  const showDomainChrome = domainHeader != null || !hideDomain;
  const domainChromeText = domainHeader ?? domain;

  const domainChrome = showDomainChrome ? (
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
          <h1
            className={cn(
              'truncate text-2xl sm:text-3xl lg:text-4xl',
              domainHeaderPlaceholder ? 'text-white/55' : 'text-white'
            )}
          >
            {domainChromeText}
          </h1>
        </div>
      </Container>
    </div>
  ) : null;

  const stepBar = showStepBar ? (
    <WizardStepBar
      currentStepId={toWizardStepBarId(step)}
      visitedSteps={visitedSteps}
      disabledStepIds={disabledStepIds}
      onStepClick={onStepClick}
      showAccountStep={showAccountStepInBar}
      showEuRepStep={showEuRepStepInBar}
    />
  ) : null;

  return (
    <ServiceWizardShell
      serviceLabel={tGenerator('label')}
      quitHref={quitHref}
      onQuit={() => {
        clearWizardState();
      }}
      faqContent={<ServiceWizardFaqPanel variant="generator" />}
      quitDisabled={quitDisabled}
      confirmQuit={confirmQuit}
      showQuit={showQuit}
      cancelTitle={tCancel('title')}
      cancelBody={tCancel('body')}
      cancelQuitLabel={tCancel('quit')}
      cancelProceedLabel={tCancel('proceed')}
      faqLabel={tCommon('faq')}
      faqShortLabel={tCommon('faqShort')}
    >
      {!scrollStepsWithContent ? domainChrome : null}
      {stepBar && !scrollStepsWithContent ? stepBar : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StepLayoutFooterContextProvider value={scrollStepsWithContent ? setLayoutFooter : null}>
          <div
            ref={scrollRef}
            className={
              scrollStepsWithContent
                ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
                : 'flex min-h-0 flex-1 flex-col overflow-hidden'
            }
          >
            {scrollStepsWithContent ? domainChrome : null}
            {stepBar && scrollStepsWithContent ? stepBar : null}
            {children}
          </div>
        </StepLayoutFooterContextProvider>
        {layoutFooter}
      </div>
    </ServiceWizardShell>
  );
}
