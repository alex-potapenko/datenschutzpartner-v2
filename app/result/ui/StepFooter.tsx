'use client';

import { Button } from '@/components/ui';
import { ArrowLeft, CaretRight } from '@/components/ui';
import { Container } from '@/components/shared/Container';

interface StepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  ctaLabel?: string;
  ctaDisabled?: boolean;
}

export function StepFooter({
  onBack,
  onContinue,
  ctaLabel = 'Continue',
  ctaDisabled,
}: StepFooterProps) {
  return (
    <div className="border-border bg-background sticky bottom-0 z-10 border-t">
      <Container>
        <div className="border-border flex items-center justify-between gap-4 border-r border-l px-8 py-5">
          {onBack ? (
            <Button
              variant="outline"
              size="lg"
              className="h-14 gap-2 rounded-full px-8"
              onPress={onBack}
            >
              <ArrowLeft size={16} weight="bold" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {onContinue && (
            <Button
              variant="primary"
              size="lg"
              className="h-14 gap-2 rounded-full px-8"
              onPress={onContinue}
              isDisabled={ctaDisabled}
            >
              {ctaLabel}
              <CaretRight size={16} weight="bold" />
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
}
