'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Transition } from 'motion/react';
import { Globe, Sparkle, cn } from '@/components/ui';
import { Button } from '@/components/ui';
import { writePendingScanUrl } from '@/lib/pending-scan-url';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';

const SCAN_BORDER_GRADIENT_STOPS = ['#ef4444', '#f97316', '#7c3aed', '#3b82f6', '#16a34a'] as const;
const scanBorderGradientLinear = `linear-gradient(135deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')})`;
const scanBorderGradientConic = `conic-gradient(from 0deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')}, ${SCAN_BORDER_GRADIENT_STOPS[0]})`;

const IDLE_PILL_WIDTH = 480;
const GLOBE_SIZE = 24;
const CONTENT_GAP = 12;
const PILL_PAD_LEFT = 24;
const PILL_PAD_RIGHT_SCAN = 40;
const PILL_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};
const BUTTON_FADE_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.16,
  ease: [0.4, 0, 1, 1],
};
const SCAN_PHASE_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

interface ScanFormProps {
  dark?: boolean;
  className?: string;
  /** Prepaid policy subscription slot to fill after scan. */
  fillSubscriptionId?: string;
  /** Pre-filled website URL shown in the input. */
  initialUrl?: string;
  /** Focus the URL field on mount. */
  autoFocus?: boolean;
  /** After Scan: hide the button, shrink to the URL, run the color strip. */
  scanning?: boolean;
  /** Label inside the pill while scanning (defaults to the typed URL). */
  displayValue?: string;
  /** Replaces pill text during scan (e.g. “Scanning your website” + animated dots). */
  scanningLabel?: string;
  /** Icon shown at the start of the pill while scanning (defaults to globe). */
  scanningIcon?: typeof Globe;
  /** Changes when scan phases switch — drives label/icon crossfade. */
  scanningPhaseKey?: string;
  /** Called instead of navigating to `/result` — used by the add-website wizard. */
  onSubmitUrl?: (url: string) => void;
  /** Live URL edits — syncs wizard chrome with the input. */
  onUrlChange?: (url: string) => void;
}

function normalizeScanUrl(value: string): string | null {
  return normalizeAndValidateWebsiteUrl(value);
}

function ScanRunningStrip({ className }: { className?: string }) {
  return (
    <span
      className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-full', className)}
      aria-hidden
    >
      <span
        className="absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none"
        style={{ background: scanBorderGradientConic }}
      />
    </span>
  );
}

/** 3px ring painted on the edge — does not inset/shift the inner content. */
function ScanBorderRing({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500',
        active ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        padding: 3,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <span
        className="absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none"
        style={{ background: scanBorderGradientConic }}
      />
    </span>
  );
}

export function ScanForm({
  dark,
  className,
  fillSubscriptionId,
  initialUrl,
  autoFocus = false,
  scanning = false,
  displayValue,
  scanningLabel,
  scanningIcon: ScanningIcon = Globe,
  scanningPhaseKey,
  onSubmitUrl,
  onUrlChange,
}: ScanFormProps) {
  const router = useRouter();
  const t = useTranslations('landing');
  const tScan = useTranslations('result.scanStep');
  const tValidation = useTranslations('validation');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [scanDots, setScanDots] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scanWidth, setScanWidth] = useState(IDLE_PILL_WIDTH);
  const [buttonWidth, setButtonWidth] = useState(0);
  const scanBaseLabel = scanning && scanningLabel ? scanningLabel : '';
  const scanSuffix = scanning && scanningLabel ? '.'.repeat(scanDots) : '';
  const visibleLabel = scanning
    ? scanBaseLabel
      ? `${scanBaseLabel}${scanSuffix}`
      : url || displayValue || ''
    : url || displayValue || '';

  useEffect(() => {
    if (!scanning || !scanningLabel) return;
    const intervalId = window.setInterval(() => {
      setScanDots((current) => (current + 1) % 4);
    }, 400);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [scanning, scanningLabel]);

  useEffect(() => {
    setScanDots(0);
  }, [scanningPhaseKey, scanningLabel]);

  const showAnimatedScanLabel = scanning && scanningLabel && scanningPhaseKey;
  const phaseKey = scanningPhaseKey ?? scanningLabel ?? 'scan';
  const morphsOnScan = onSubmitUrl != null;

  useEffect(() => {
    if (!autoFocus || scanning) return;
    inputRef.current?.focus();
  }, [autoFocus, scanning]);

  useLayoutEffect(() => {
    if (!scanning && buttonRef.current) {
      const measuredButton = buttonRef.current.getBoundingClientRect().width;
      if (measuredButton > 0) setButtonWidth(measuredButton);
    }

    const measuredText = textMeasureRef.current?.getBoundingClientRect().width ?? 0;
    if (measuredText > 0) {
      setScanWidth(PILL_PAD_LEFT + GLOBE_SIZE + CONTENT_GAP + measuredText + PILL_PAD_RIGHT_SCAN);
    }
  }, [scanning, visibleLabel, scanningLabel]);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const normalized = normalizeScanUrl(url);
    if (!normalized) {
      toast.error(url.trim() ? tValidation('website') : tValidation('required'));
      return;
    }
    if (onSubmitUrl) {
      onSubmitUrl(normalized);
      return;
    }
    writePendingScanUrl(normalized);
    const params = new URLSearchParams({ step: 'website' });
    if (fillSubscriptionId) {
      params.set('fillSubscription', fillSubscriptionId);
    }
    router.push(`/result?${params.toString()}`);
  }

  const idleWidth = morphsOnScan ? IDLE_PILL_WIDTH : '100%';
  const pillWidth = scanning ? scanWidth : idleWidth;

  return (
    <motion.div
      initial={false}
      animate={morphsOnScan ? { width: pillWidth } : undefined}
      transition={PILL_TRANSITION}
      className={cn(
        'group/scan relative max-w-full',
        morphsOnScan && !scanning && 'w-[480px]',
        !morphsOnScan && !scanning && className
      )}
      style={!morphsOnScan ? { width: scanning ? scanWidth : '100%' } : undefined}
    >
      <span
        ref={textMeasureRef}
        aria-hidden
        className="pointer-events-none invisible absolute text-base font-semibold whitespace-nowrap sm:text-lg"
      >
        {scanning && scanningLabel ? `${scanningLabel}...` : visibleLabel}
      </span>

      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full blur-2xl transition-opacity duration-500',
          scanning ? 'opacity-50' : 'opacity-0 group-focus-within/scan:opacity-50'
        )}
      >
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              scanning ? 'opacity-0' : 'opacity-100'
            )}
            style={{ background: scanBorderGradientLinear }}
          />
          <span
            className={cn(
              'absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none',
              scanning ? 'opacity-100' : 'opacity-0'
            )}
            style={{ background: scanBorderGradientConic }}
          />
        </span>
      </span>

      <form
        id="scan-form"
        onSubmit={handleSubmit}
        className={cn(
          'relative z-10 flex h-20 items-center overflow-hidden rounded-full bg-white py-3 pl-6',
          scanning
            ? 'pr-10'
            : 'pr-3 shadow-[0_4px_32px_rgba(0,0,0,0.10)] transition-shadow duration-500 group-focus-within/scan:shadow-none',
          !morphsOnScan &&
            !scanning &&
            'h-auto flex-col gap-4 overflow-visible py-0 pr-0 pl-0 shadow-none sm:h-20 sm:flex-row sm:gap-0 sm:overflow-hidden sm:py-3 sm:pr-3 sm:pl-6 sm:shadow-[0_4px_32px_rgba(0,0,0,0.10)]'
        )}
        style={
          scanning
            ? { paddingRight: PILL_PAD_RIGHT_SCAN }
            : morphsOnScan
              ? { paddingRight: Math.max(12, buttonWidth + 12) }
              : undefined
        }
      >
        <ScanBorderRing active={scanning} />

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
          <div
            className="relative flex shrink-0 items-center justify-center"
            style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}
          >
            {showAnimatedScanLabel ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={phaseKey}
                  initial={{ opacity: 0, scale: 0.82, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.82, filter: 'blur(6px)' }}
                  transition={SCAN_PHASE_TRANSITION}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ScanningIcon
                    size={GLOBE_SIZE}
                    weight="regular"
                    style={{ color: 'var(--accent)' }}
                  />
                </motion.span>
              </AnimatePresence>
            ) : (
              <ScanningIcon
                size={GLOBE_SIZE}
                weight="regular"
                className="shrink-0"
                style={{ color: 'var(--accent)' }}
              />
            )}
          </div>
          {showAnimatedScanLabel ? (
            <div
              className="relative min-w-0 overflow-hidden"
              aria-live="polite"
              aria-atomic
              role="status"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={phaseKey}
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={SCAN_PHASE_TRANSITION}
                  className="block shrink-0 text-base font-semibold whitespace-nowrap sm:text-lg"
                  style={{ color: 'var(--accent)' }}
                >
                  {visibleLabel}
                </motion.span>
              </AnimatePresence>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              autoFocus={autoFocus && !scanning}
              readOnly={scanning}
              tabIndex={scanning ? -1 : 0}
              value={visibleLabel}
              onChange={(e) => {
                const next = e.target.value;
                setUrl(next);
                onUrlChange?.(next);
              }}
              placeholder={t('scanPlaceholder')}
              aria-label={scanning ? (scanningLabel ?? tScan('scanningWebsite')) : t('scanUrlAria')}
              className={[
                'bg-transparent text-base font-semibold outline-none sm:text-lg',
                scanning ? 'w-auto shrink-0' : 'min-w-0 flex-1',
                dark
                  ? 'text-white placeholder:text-white/40'
                  : 'text-[var(--accent)] placeholder:text-[var(--accent)]',
              ].join(' ')}
            />
          )}
        </div>

        <motion.div
          ref={buttonRef}
          initial={false}
          animate={{ opacity: scanning ? 0 : 1 }}
          transition={BUTTON_FADE_TRANSITION}
          className={cn(
            'z-10 shrink-0',
            morphsOnScan || scanning ? 'absolute top-1/2 right-3 -translate-y-1/2' : 'relative',
            !morphsOnScan && !scanning && 'w-full sm:w-auto'
          )}
        >
          <div
            className="group relative h-12 w-full rounded-full p-[3px] sm:h-14 sm:w-auto"
            style={{ background: scanBorderGradientLinear }}
          >
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
              aria-hidden
            >
              <ScanRunningStrip />
              <span className="absolute inset-0 bg-white/30 mix-blend-screen" />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isDisabled={scanning}
              className="relative z-10 h-full min-h-0 w-full gap-2 rounded-full border-0 bg-[#2F5486] text-base sm:w-auto sm:text-lg"
            >
              <Sparkle size={18} weight="fill" />
              {t('scanButton')}
            </Button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
