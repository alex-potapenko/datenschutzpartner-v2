'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Transition } from 'motion/react';
import { Globe, Sparkle, StarFour, cn, useOverlayState } from '@/components/ui';
import { Button } from '@/components/ui';
import { useSession } from '@/api/auth';
import { checkExistingSitePolicy } from '@/api/existing-purchase';
import { ExistingPurchaseLoginDialog } from '@/components/shared/ExistingPurchaseLoginDialog';
import {
  accountLocationHref,
  addWebsiteWizardHref,
  fillPolicySlotWizardHref,
  PRIVACY_POLICY_ACCOUNT_HREF,
} from '@/lib/account-routes';
import { writePendingScanUrl } from '@/lib/pending-scan-url';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';
import {
  ScanPillBorderRing,
  scanBorderGradientConic,
  scanBorderGradientLinear,
} from '@/components/shared/scan-pill-visual';

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
const ICON_ORBIT_RADIUS = 5;
const ICON_ORBIT_DURATION = 2.2;
const SPARK_COUNT = 4;

const SPARK_MIN_STOP_DISTANCE = 10;

type ScanSpark = {
  id: number;
  endX: number;
  endY: number;
  stopX: number;
  stopY: number;
  size: number;
  duration: number;
  delay: number;
};

function buildScanSpark(id: number): ScanSpark {
  const angleRad = Math.random() * Math.PI * 2;
  const distance = 18 + Math.random() * 22;
  const endX = Math.cos(angleRad) * distance;
  const endY = Math.sin(angleRad) * distance;
  const stopFactor = Math.min(
    Math.max(SPARK_MIN_STOP_DISTANCE / distance, 0.38 + Math.random() * 0.14),
    0.72
  );
  return {
    id,
    endX,
    endY,
    stopX: endX * stopFactor,
    stopY: endY * stopFactor,
    size: 8 + Math.random() * 6,
    duration: 0.22 + Math.random() * 0.35,
    delay: Math.random() * 0.55,
  };
}

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

function ScanSparkParticle({ sparkId }: { sparkId: number }) {
  const [cycle, setCycle] = useState(0);
  const spark = useMemo(() => buildScanSpark(sparkId), [cycle, sparkId]);

  return (
    <motion.span
      key={cycle}
      className="absolute top-1/2 left-1/2"
      initial={{ x: spark.endX, y: spark.endY, opacity: 0, scale: 1.1 }}
      animate={{
        x: [spark.endX, spark.stopX],
        y: [spark.endY, spark.stopY],
        opacity: [0, 1, 0],
        scale: [1.1, 0.9, 0.65],
      }}
      transition={{
        duration: spark.duration,
        delay: spark.delay,
        ease: 'easeIn',
      }}
      onAnimationComplete={() => {
        setCycle((current) => current + 1);
      }}
    >
      <StarFour
        size={spark.size}
        weight="fill"
        className="-translate-x-1/2 -translate-y-1/2"
        style={{ color: 'var(--accent)' }}
      />
    </motion.span>
  );
}

function ScanIconSparks({ count }: { count: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden>
      {Array.from({ length: count }, (_, sparkId) => (
        <ScanSparkParticle key={sparkId} sparkId={sparkId} />
      ))}
    </span>
  );
}

function OrbitingScanIcon({ icon: Icon, size }: { icon: typeof Globe; size: number }) {
  return (
    <>
      <motion.span
        className="absolute inset-0 motion-reduce:hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: ICON_ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      >
        <motion.span
          className="absolute top-1/2 left-1/2"
          style={{ x: '-50%', y: `calc(-50% - ${ICON_ORBIT_RADIUS}px)` }}
          animate={{ rotate: -360 }}
          transition={{ duration: ICON_ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
        >
          <span className="relative block">
            <ScanIconSparks count={SPARK_COUNT} />
            <Icon size={size} weight="bold" style={{ color: 'var(--accent)' }} />
          </span>
        </motion.span>
      </motion.span>
      <span className="absolute inset-0 m-auto hidden motion-reduce:block">
        <ScanIconSparks count={SPARK_COUNT} />
        <Icon
          size={size}
          weight="bold"
          className="relative"
          style={{ color: 'var(--accent)' }}
          aria-hidden
        />
      </span>
    </>
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email && session.data.emailVerified);
  const duplicateDialog = useOverlayState();
  const [duplicateSite, setDuplicateSite] = useState<{
    displayName: string;
    href?: string;
  } | null>(null);
  const t = useTranslations('landing');
  const tScan = useTranslations('result.scanStep');
  const tValidation = useTranslations('validation');
  const [url, setUrl] = useState(initialUrl ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scanWidth, setScanWidth] = useState(IDLE_PILL_WIDTH);
  const [buttonWidth, setButtonWidth] = useState(0);
  const visibleLabel = scanning
    ? (scanningLabel ?? (url || displayValue || ''))
    : url || displayValue || '';

  const showScanStatus = scanning && scanningLabel;
  const showPhaseCrossfade = showScanStatus && scanningPhaseKey;
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

  async function handleSubmit(e: React.SyntheticEvent) {
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
    if (isAuthenticated) {
      try {
        const existing = await checkExistingSitePolicy(normalized);
        if (existing.exists) {
          setDuplicateSite({
            displayName: existing.displayName ?? normalized,
            href: existing.href,
          });
          duplicateDialog.open();
          return;
        }
      } catch {
        // If the duplicate check fails, don't block checkout.
      }
    }
    writePendingScanUrl(normalized);
    if (isAuthenticated) {
      const accountReturn =
        accountLocationHref(pathname, searchParams) ?? PRIVACY_POLICY_ACCOUNT_HREF;
      if (fillSubscriptionId) {
        router.push(fillPolicySlotWizardHref(fillSubscriptionId, accountReturn));
      } else {
        router.push(addWebsiteWizardHref(accountReturn));
      }
      return;
    }
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
        {visibleLabel}
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
          'relative z-10 flex h-20 items-center rounded-full bg-white py-3 pl-6',
          scanning ? 'overflow-visible pr-10' : 'overflow-hidden pr-3',
          !scanning &&
            'shadow-[0_4px_32px_rgba(0,0,0,0.10)] transition-shadow duration-500 group-focus-within/scan:shadow-none',
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
        <ScanPillBorderRing active={scanning} />

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
          <div
            className="relative flex shrink-0 items-center justify-center overflow-visible"
            style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}
          >
            {showScanStatus ? (
              showPhaseCrossfade ? (
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
                <OrbitingScanIcon icon={ScanningIcon} size={GLOBE_SIZE} />
              )
            ) : (
              <ScanningIcon
                size={GLOBE_SIZE}
                weight="regular"
                className="shrink-0"
                style={{ color: 'var(--accent)' }}
              />
            )}
          </div>
          {showScanStatus ? (
            <div
              className="relative min-w-0 overflow-hidden"
              aria-live="polite"
              aria-atomic
              role="status"
            >
              {showPhaseCrossfade ? (
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
              ) : (
                <span
                  className="block shrink-0 text-base font-semibold whitespace-nowrap sm:text-lg"
                  style={{ color: 'var(--accent)' }}
                >
                  {visibleLabel}
                </span>
              )}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              // UX: focus scan field on landing entry
              // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional landing scan focus
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
      {duplicateSite ? (
        <ExistingPurchaseLoginDialog
          state={duplicateDialog}
          variant="site"
          displayName={duplicateSite.displayName}
          mode={isAuthenticated ? 'logged' : 'guest'}
          returnTo="/result?step=website"
          entityHref={duplicateSite.href}
        />
      ) : null}
    </motion.div>
  );
}
