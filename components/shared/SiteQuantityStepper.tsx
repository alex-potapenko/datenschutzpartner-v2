'use client';

import { Button, Minus, Plus } from '@/components/ui';
import { GENERATOR_SITE_QUANTITY_MAX, GENERATOR_SITE_QUANTITY_MIN } from '@/api/checkout';
import { AnimatedRollingNumber } from '@/components/shared/AnimatedRollingNumber';

type SiteQuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decreaseLabel: string;
  increaseLabel: string;
  valueLabel: string;
};

export function SiteQuantityStepper({
  value,
  onChange,
  min = GENERATOR_SITE_QUANTITY_MIN,
  max = GENERATOR_SITE_QUANTITY_MAX,
  decreaseLabel,
  increaseLabel,
  valueLabel,
}: SiteQuantityStepperProps) {
  return (
    <div role="group" aria-label={valueLabel} className="flex items-center justify-center gap-5">
      <Button
        variant="outline"
        size="md"
        isIconOnly
        className="size-11 shrink-0 rounded-full"
        aria-label={decreaseLabel}
        isDisabled={value <= min}
        onPress={() => {
          onChange(Math.max(min, value - 1));
        }}
      >
        <Minus size={18} weight="bold" aria-hidden />
      </Button>

      <span
        aria-live="polite"
        className="font-display text-foreground flex min-w-12 justify-center text-4xl leading-none font-bold tabular-nums"
      >
        <AnimatedRollingNumber value={value} />
      </span>

      <Button
        variant="outline"
        size="md"
        isIconOnly
        className="size-11 shrink-0 rounded-full"
        aria-label={increaseLabel}
        isDisabled={value >= max}
        onPress={() => {
          onChange(Math.min(max, value + 1));
        }}
      >
        <Plus size={18} weight="bold" aria-hidden />
      </Button>
    </div>
  );
}
