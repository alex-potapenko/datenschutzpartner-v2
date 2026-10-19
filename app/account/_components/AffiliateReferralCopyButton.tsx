'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button, Check, Copy } from '@/components/ui';

const COPY_LINK_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export function AffiliateReferralCopyButton({
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const motionDuration = reduceMotion ? 0 : 0.22;
  const transition = {
    duration: motionDuration,
    ease: COPY_LINK_MOTION_EASE,
  } as const;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      isIconOnly
      className="size-8 shrink-0 rounded-full"
      aria-label={copied ? copiedLabel : copyLabel}
      aria-live="polite"
      onPress={onCopy}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'copied' : 'copy'}
          className="inline-flex items-center justify-center"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
          transition={transition}
        >
          {copied ? (
            <Check size={16} weight="bold" aria-hidden />
          ) : (
            <Copy size={16} weight="bold" aria-hidden />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
