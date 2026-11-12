'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, Check, Copy } from '@/components/ui';
import { cn } from '@/lib/utils';

const COPY_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

type CopyClipboardButtonProps = {
  copyLabel: string;
  copiedLabel?: string;
  onCopy: () => void | Promise<void>;
  copyErrorMessage?: string;
  className?: string;
  iconSize?: number;
  resetMs?: number;
};

function CopyButtonContent({
  copied,
  copyLabel,
  resolvedCopiedLabel,
  iconSize,
  reduceMotion,
  transition,
}: {
  copied: boolean;
  copyLabel: string;
  resolvedCopiedLabel: string;
  iconSize: number;
  reduceMotion: boolean | null;
  transition: { duration: number; ease: readonly [number, number, number, number] };
}) {
  const label = copied ? resolvedCopiedLabel : copyLabel;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'copied-icon' : 'copy-icon'}
            className="inline-flex items-center justify-center"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.88 }}
            transition={transition}
          >
            {copied ? (
              <Check size={iconSize} weight="bold" aria-hidden />
            ) : (
              <Copy size={iconSize} weight="bold" aria-hidden />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="inline-block">{label}</span>
    </span>
  );
}

/** Outline copy control — icon + label cross-fade to “Copied!” without success toast. */
export function CopyClipboardButton({
  copyLabel,
  copiedLabel,
  onCopy,
  copyErrorMessage,
  className,
  iconSize = 14,
  resetMs = 2000,
}: CopyClipboardButtonProps) {
  const t = useTranslations('common');
  const resolvedCopiedLabel = copiedLabel ?? t('copied');
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionDuration = reduceMotion ? 0 : 0.22;
  const transition = {
    duration: motionDuration,
    ease: COPY_MOTION_EASE,
  } as const;

  const measureRef = useRef<HTMLSpanElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) {
      return;
    }
    setButtonWidth(el.offsetWidth);
  }, [copied, copyLabel, resolvedCopiedLabel, iconSize, className]);

  async function handlePress() {
    try {
      await onCopy();
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, resetMs);
    } catch {
      if (copyErrorMessage) {
        toast.error(copyErrorMessage);
      }
    }
  }

  const contentProps = {
    copied,
    copyLabel,
    resolvedCopiedLabel,
    iconSize,
    reduceMotion,
    transition,
  };

  return (
    <div className="relative inline-flex max-w-none align-top">
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 inline-flex"
      >
        <Button variant="outline" size="sm" className={className} isDisabled>
          <CopyButtonContent {...contentProps} />
        </Button>
      </span>

      <motion.div
        className="inline-flex max-w-none min-w-0 overflow-hidden"
        initial={false}
        animate={{ width: buttonWidth ?? 'auto' }}
        transition={{
          duration: motionDuration,
          ease: COPY_MOTION_EASE,
        }}
      >
        <Button
          variant="outline"
          size="sm"
          className={cn('w-full max-w-none shrink-0', className)}
          aria-live="polite"
          onPress={() => {
            void handlePress();
          }}
        >
          <CopyButtonContent {...contentProps} />
        </Button>
      </motion.div>
    </div>
  );
}
