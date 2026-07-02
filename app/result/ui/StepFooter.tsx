'use client';

import { Button, CaretLeft, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';

interface StepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  ctaLabel?: string;
  skipLabel?: string;
  ctaDisabled?: boolean;
}

export function StepFooter({
  onBack,
  onContinue,
  onSkip,
  ctaLabel = 'Continue',
  skipLabel = 'Skip',
  ctaDisabled,
}: StepFooterProps) {
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
              <span className="hidden sm:inline">Back</span>
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
                {skipLabel}
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
                <span className="truncate">{ctaLabel}</span>
                <CaretRight size={16} weight="bold" className="shrink-0" />
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}
