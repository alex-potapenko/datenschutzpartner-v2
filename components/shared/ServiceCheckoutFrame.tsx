'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { StepLayoutFooterContextProvider } from '@/app/result/ui/StepLayoutFooter';
import { Button, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { ServiceWizardShell } from '@/components/shared/ServiceWizardShell';
import type { ServiceBrandId } from '@/components/shared/topbars/service-brands';
import { cn } from '@/lib/utils';

export function ServiceWizardAccentHeader({
  title,
  placeholder = false,
}: {
  title: string;
  placeholder?: boolean;
}) {
  return (
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
              placeholder ? 'text-white/55' : 'text-white'
            )}
          >
            {title}
          </h1>
        </div>
      </Container>
    </div>
  );
}

/** Scrollable checkout step body with a pinned footer — mirrors policy wizard scroll steps. */
export function ServiceCheckoutScrollLayout({ children }: { children: ReactNode }) {
  const [layoutFooter, setLayoutFooter] = useState<ReactNode | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StepLayoutFooterContextProvider value={setLayoutFooter}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </StepLayoutFooterContextProvider>
      {layoutFooter}
    </div>
  );
}

export function ServiceCheckoutShell({
  serviceLabel,
  serviceBrandId,
  quitHref,
  onQuit,
  faqHref,
  faqContent,
  cancelTitle,
  cancelBody,
  cancelQuitLabel,
  cancelProceedLabel,
  confirmQuit,
  children,
}: {
  serviceLabel: string;
  serviceBrandId?: ServiceBrandId;
  quitHref: string;
  onQuit?: () => void;
  faqHref?: string;
  faqContent?: ReactNode;
  confirmQuit?: boolean;
  cancelTitle: string;
  cancelBody: string;
  cancelQuitLabel: string;
  cancelProceedLabel: string;
  children: ReactNode;
}) {
  const tCommon = useTranslations('common');

  return (
    <ServiceWizardShell
      serviceLabel={serviceLabel}
      serviceBrandId={serviceBrandId}
      quitHref={quitHref}
      onQuit={onQuit}
      faqHref={faqHref}
      faqContent={faqContent}
      cancelTitle={cancelTitle}
      cancelBody={cancelBody}
      cancelQuitLabel={cancelQuitLabel}
      cancelProceedLabel={cancelProceedLabel}
      confirmQuit={confirmQuit}
      faqLabel={tCommon('faq')}
      faqShortLabel={tCommon('faqShort')}
    >
      {children}
    </ServiceWizardShell>
  );
}

export function ServiceCheckoutStepHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-border shrink-0 border-b">
      <Container>
        <div className="border-border flex flex-col gap-3 border-r border-l px-4 pt-10 pb-8 sm:px-8 sm:pt-16 sm:pb-10">
          <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
          {description ? (
            <p className="text-foreground text-base leading-relaxed">{description}</p>
          ) : null}
        </div>
      </Container>
    </div>
  );
}

export function ServiceCheckoutStepFooter({
  onContinue,
  ctaLabel,
  ctaDisabled,
}: {
  onContinue: () => void;
  ctaLabel: ReactNode;
  ctaDisabled?: boolean;
}) {
  return (
    <div className="border-border shrink-0 border-t">
      <Container>
        <div className="border-border flex items-center justify-end gap-2 border-r border-l px-4 py-4 sm:gap-4 sm:px-8 sm:py-5">
          <Button
            variant="primary"
            size="lg"
            className="h-11 min-w-0 gap-2 rounded-full px-6 sm:h-14 sm:px-8"
            onPress={onContinue}
            isDisabled={ctaDisabled}
          >
            <span className="truncate">{ctaLabel}</span>
            <CaretRight size={16} weight="bold" className="shrink-0" />
          </Button>
        </div>
      </Container>
    </div>
  );
}
