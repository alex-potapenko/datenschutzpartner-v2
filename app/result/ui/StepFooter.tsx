'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button, CaretLeft, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';

interface StepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  ctaLabel?: ReactNode;
  skipLabel?: string;
  backLabel?: ReactNode;
  ctaDisabled?: boolean;
}

export function StepFooter({
  onBack,
  onContinue,
  onSkip,
  ctaLabel,
  skipLabel,
  backLabel,
  ctaDisabled,
}: StepFooterProps) {
  const t = useTranslations('common');

  return (
    <div className="border-border bg-background sticky bottom-0 z-10 border-t">
      <Container>
        <div className="border-border flex items-center justify-between gap-2 border-r border-l px-4 py-4 sm:gap-4 sm:px-8 sm:py-5">
          {onBack ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11 shrink-0 gap-2 rounded-full sm:h-14"
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
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {onSkip ? (
              <Button
                variant="outline"
                size="lg"
                className="h-11 shrink-0 rounded-full sm:h-14"
                onPress={onSkip}
              >
                {skipLabel ?? t('skip')}
              </Button>
            ) : null}
            {onContinue ? (
              <Button
                variant="primary"
                size="lg"
                className="h-11 min-w-0 gap-2 rounded-full sm:h-14"
                onPress={onContinue}
                isDisabled={ctaDisabled}
              >
                <span className="truncate">{ctaLabel ?? t('continue')}</span>
                <CaretRight size={16} weight="bold" className="shrink-0" />
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}
