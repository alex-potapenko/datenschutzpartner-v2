'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { ServiceWizardShell } from '@/components/shared/ServiceWizardShell';

export function ServiceCheckoutShell({
  serviceLabel,
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
