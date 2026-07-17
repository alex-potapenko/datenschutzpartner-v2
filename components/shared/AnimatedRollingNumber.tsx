'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function RollingDigit({ digit, className }: { digit: number; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <span
      aria-hidden
      className={cn('relative inline-block h-[1em] overflow-hidden', className)}
      style={{ width: '0.65em' }}
    >
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 140, damping: 20, mass: 0.65 }
        }
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            className="flex h-[1em] items-center justify-center leading-none tabular-nums"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export type AnimatedRollingNumberProps = {
  value: number;
  className?: string;
};

export function AnimatedRollingNumber({ value, className }: AnimatedRollingNumberProps) {
  const normalized = Math.max(0, Math.round(value));
  const digits = String(normalized).split('').map(Number);

  return (
    <span className={cn('inline-flex items-end', className)} aria-label={String(normalized)}>
      {digits.map((digit, index) => {
        const place = 10 ** (digits.length - 1 - index);

        return <RollingDigit key={place} digit={digit} />;
      })}
    </span>
  );
}
