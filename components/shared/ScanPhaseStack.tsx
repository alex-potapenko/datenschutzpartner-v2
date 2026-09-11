'use client';

/** Reusable multi-phase scan stack — not wired into the wizard yet (ScanStep uses the two-phase pill). */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { CheckCircle, cn } from '@/components/ui';
import {
  SCAN_DURATION_MS,
  SCAN_PHASES,
  scanPhaseCompletionDelayMs,
  type ScanPhaseDefinition,
  type ScanPhaseId,
} from '@/app/result/content/scan-phases';

const SCAN_BORDER_GRADIENT_STOPS = ['#ef4444', '#f97316', '#7c3aed', '#3b82f6', '#16a34a'] as const;
const scanBorderGradientConic = `conic-gradient(from 0deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')}, ${SCAN_BORDER_GRADIENT_STOPS[0]})`;

const ICON_SIZE = 24;
const CHIP_ICON_SIZE = 20;
const CONTENT_GAP = 12;
const PILL_PAD_X = 24;
const PILL_PAD_RIGHT = 40;
const CHIP_HEIGHT = 48;
const ACTIVE_HEIGHT = 80;
const STACK_GAP = 16;

const MORPH_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

type ScanPhaseVariant = 'active' | 'completed' | 'pending';

function ScanRunningGlow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-3 -z-10 rounded-full opacity-50 blur-2xl motion-reduce:opacity-30 motion-reduce:blur-xl"
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className="absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none"
          style={{ background: scanBorderGradientConic }}
        />
      </span>
    </span>
  );
}

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

function PhaseIcon({
  icon: Icon,
  size,
  muted,
}: {
  icon: ScanPhaseDefinition['icon'];
  size: number;
  muted?: boolean;
}) {
  return (
    <Icon
      size={size}
      weight="regular"
      className="shrink-0"
      style={{ color: muted ? 'var(--muted)' : 'var(--accent)' }}
    />
  );
}

/** One row per phase — always full stack width so the pill morphs around its own center. */
function ScanPhaseRow({
  phase,
  label,
  variant,
  rowWidth,
  transition,
}: {
  phase: ScanPhaseDefinition;
  label: string;
  variant: ScanPhaseVariant;
  rowWidth: number;
  transition: Transition;
}) {
  const isActive = variant === 'active';
  const isPending = variant === 'pending';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center',
        isActive ? 'z-[1]' : 'z-0'
      )}
      style={{ width: rowWidth, height: isActive ? ACTIVE_HEIGHT : CHIP_HEIGHT }}
    >
      {isActive ? <ScanRunningGlow /> : null}
      <motion.div
        layout
        transition={transition}
        className={cn(
          'relative flex max-w-full items-center gap-3 rounded-full bg-white',
          isActive ? 'z-[1] w-full pl-6' : 'border-border z-0 w-fit border px-4'
        )}
        style={{
          height: isActive ? ACTIVE_HEIGHT : CHIP_HEIGHT,
          paddingRight: isActive ? PILL_PAD_RIGHT : undefined,
        }}
      >
        <ScanBorderRing active={isActive} />
        {isActive ? (
          <PhaseIcon icon={phase.icon} size={ICON_SIZE} />
        ) : isPending ? (
          <PhaseIcon icon={phase.icon} size={CHIP_ICON_SIZE} muted />
        ) : (
          <CheckCircle
            size={CHIP_ICON_SIZE}
            weight="fill"
            className="text-success shrink-0"
            aria-hidden
          />
        )}
        <motion.span
          layout="position"
          transition={transition}
          className={cn(
            'relative z-10 min-w-0 font-semibold whitespace-nowrap',
            isActive ? 'text-base text-[var(--accent)] sm:text-lg' : 'text-sm',
            isPending ? 'text-muted' : isActive ? undefined : 'text-foreground'
          )}
        >
          {label}
        </motion.span>
      </motion.div>
    </div>
  );
}

function phaseVariant(index: number, activeIndex: number): ScanPhaseVariant {
  if (index < activeIndex) return 'completed';
  if (index === activeIndex) return 'active';
  return 'pending';
}

/** Distance from the stack top to the vertical center of the active row. */
function activeRowCenterOffset(activeIndex: number): number {
  return activeIndex * (CHIP_HEIGHT + STACK_GAP) + ACTIVE_HEIGHT / 2;
}

export function ScanPhaseStack({
  domain,
  active,
  onComplete,
  className,
}: {
  domain: string;
  active: boolean;
  onComplete: () => void;
  className?: string;
}) {
  if (!active) {
    return <div className={cn('relative h-full min-h-[280px] w-full', className)} />;
  }

  return (
    <ScanPhaseStackActive
      key={domain}
      domain={domain}
      onComplete={onComplete}
      className={className}
    />
  );
}

function ScanPhaseStackActive({
  domain,
  onComplete,
  className,
}: {
  domain: string;
  onComplete: () => void;
  className?: string;
}) {
  const t = useTranslations('result.scanStep');
  const reduceMotion = useReducedMotion();
  const [completedIds, setCompletedIds] = useState<ScanPhaseId[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [pillWidth, setPillWidth] = useState(480);

  function phaseLabel(phase: ScanPhaseDefinition) {
    return t(phase.messageKey, phase.id === 'connecting' ? { domain } : undefined);
  }

  const activeIndex = completedIds.length;
  const activePhase = SCAN_PHASES[activeIndex];
  const activeLabel = activePhase ? phaseLabel(activePhase) : '';

  useEffect(() => {
    const timeouts: number[] = [];

    for (let index = 0; index < SCAN_PHASES.length - 1; index += 1) {
      timeouts.push(
        window.setTimeout(
          () => {
            setCompletedIds(SCAN_PHASES.slice(0, index + 1).map((phase) => phase.id));
          },
          scanPhaseCompletionDelayMs(index + 1)
        )
      );
    }

    timeouts.push(
      window.setTimeout(() => {
        onComplete();
      }, SCAN_DURATION_MS)
    );

    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [onComplete]);

  useLayoutEffect(() => {
    const measuredText = measureRef.current?.getBoundingClientRect().width ?? 0;
    if (measuredText > 0) {
      setPillWidth(PILL_PAD_X + ICON_SIZE + CONTENT_GAP + measuredText + PILL_PAD_RIGHT);
    }
  }, [activeLabel, activePhase?.id]);

  const transition = reduceMotion ? { duration: 0 } : MORPH_TRANSITION;

  return (
    <div className={cn('relative h-full min-h-[280px] w-full', className)}>
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute text-base font-semibold whitespace-nowrap sm:text-lg"
      >
        {activeLabel}
      </span>

      <motion.div
        className="absolute top-1/2 left-1/2 flex flex-col items-center"
        style={{ gap: STACK_GAP }}
        animate={{ x: '-50%', y: -activeRowCenterOffset(activeIndex) }}
        transition={transition}
        role="status"
        aria-live="polite"
        aria-atomic
      >
        {SCAN_PHASES.map((phase, index) => (
          <ScanPhaseRow
            key={phase.id}
            phase={phase}
            label={phaseLabel(phase)}
            variant={phaseVariant(index, activeIndex)}
            rowWidth={pillWidth}
            transition={transition}
          />
        ))}
      </motion.div>
    </div>
  );
}
