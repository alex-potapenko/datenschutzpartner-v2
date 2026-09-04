'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button, CaretLeft, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { useStepLayoutFooterContext, useStepLayoutFooterHoist } from './StepLayoutFooter';

interface StepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  ctaLabel?: ReactNode;
  ctaNote?: ReactNode;
  showCtaCaret?: boolean;
  skipLabel?: string;
  backLabel?: ReactNode;
  ctaDisabled?: boolean;
}

function StepFooterSurface({
  onBack,
  onContinue,
  onSkip,
  ctaLabel,
  ctaNote,
  showCtaCaret = true,
  skipLabel,
  backLabel,
  ctaDisabled,
}: StepFooterProps) {
  const t = useTranslations('common');

  return (
    <div className="border-border bg-background shrink-0 border-t">
      <Container>
        <div className="border-border flex items-center justify-between gap-2 border-r border-l px-4 py-4 sm:gap-4 sm:px-8 sm:py-5">
          {onBack ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11 shrink-0 gap-2 rounded-full px-5 sm:h-14 sm:px-8"
              onPress={onBack}
            >
              <CaretLeft size={16} weight="bold" />
              <span className={backLabel ? 'inline' : 'hidden sm:inline'}>
                {backLabel ?? t('back')}
              </span>
            </Button>
          ) : (
            <div />
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
            {ctaNote ? (
              <p className="text-foreground min-w-0 text-sm leading-snug md:whitespace-nowrap">
                {ctaNote}
              </p>
            ) : null}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {onSkip ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 shrink-0 rounded-full px-5 sm:h-14 sm:px-8"
                  onPress={onSkip}
                >
                  {skipLabel ?? t('skip')}
                </Button>
              ) : null}
              {onContinue ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="h-11 min-w-0 gap-2 rounded-full px-6 sm:h-14 sm:px-8"
                  onPress={onContinue}
                  isDisabled={ctaDisabled}
                >
                  <span className="truncate">{ctaLabel ?? t('continue')}</span>
                  {showCtaCaret ? (
                    <CaretRight size={16} weight="bold" className="shrink-0" />
                  ) : null}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function StepFooter(props: StepFooterProps) {
  const hoistFooter = useStepLayoutFooterContext();
  const surface = <StepFooterSurface {...props} />;

  useStepLayoutFooterHoist(surface);

  if (hoistFooter) return null;
  return surface;
}
