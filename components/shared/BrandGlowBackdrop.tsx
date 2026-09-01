import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BrandGlowBackdropProps = {
  className?: string;
  markClassName?: string;
  /** White service icon centered on the mark (coming-soon sections). */
  centerIcon?: ReactNode;
  /** `center` fills the section (newsletter). `right` is a top-right Olympic-ring cluster. */
  placement?: 'center' | 'right';
};

const GLOW_SIZE_PX = 380;
const GLOW_RADIUS_PX = GLOW_SIZE_PX / 2;

const GLOW_BASE_STYLE = {
  width: GLOW_SIZE_PX,
  height: GLOW_SIZE_PX,
  borderRadius: '50%',
  opacity: 0.08,
  filter: 'blur(96px)',
} as const;

/** Center-to-center spacing — less than diameter so rings intersect like Olympic rings. */
const OLYMPIC_H_STEP_PX = 200;
const OLYMPIC_V_STEP_PX = 200;

const OLYMPIC_RING_CENTERS = [
  { color: '#ef4444', x: GLOW_RADIUS_PX, y: GLOW_RADIUS_PX },
  { color: '#3b82f6', x: GLOW_RADIUS_PX + OLYMPIC_H_STEP_PX, y: GLOW_RADIUS_PX },
  {
    color: '#7c3aed',
    x: GLOW_RADIUS_PX + OLYMPIC_H_STEP_PX / 2,
    y: GLOW_RADIUS_PX + OLYMPIC_V_STEP_PX,
  },
  {
    color: '#16a34a',
    x: GLOW_RADIUS_PX + OLYMPIC_H_STEP_PX * 1.5,
    y: GLOW_RADIUS_PX + OLYMPIC_V_STEP_PX,
  },
] as const;

const OLYMPIC_CLUSTER_WIDTH_PX = GLOW_RADIUS_PX + OLYMPIC_H_STEP_PX * 1.5 + GLOW_RADIUS_PX;
const OLYMPIC_CLUSTER_HEIGHT_PX = GLOW_RADIUS_PX + OLYMPIC_V_STEP_PX + GLOW_RADIUS_PX;

const OLYMPIC_LOGO_CENTER_X_PX =
  OLYMPIC_RING_CENTERS.reduce((sum, ring) => sum + ring.x, 0) / OLYMPIC_RING_CENTERS.length;
const OLYMPIC_LOGO_CENTER_Y_PX =
  OLYMPIC_RING_CENTERS.reduce((sum, ring) => sum + ring.y, 0) / OLYMPIC_RING_CENTERS.length;

function GlowOrb({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <div
      className="absolute"
      style={{
        ...GLOW_BASE_STYLE,
        background: color,
        ...style,
      }}
    />
  );
}

function RightOlympicCluster({
  markClassName,
  centerIcon,
}: {
  markClassName?: string;
  centerIcon?: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        top: -164,
        right: -224,
        width: OLYMPIC_CLUSTER_WIDTH_PX,
        height: OLYMPIC_CLUSTER_HEIGHT_PX,
      }}
    >
      {OLYMPIC_RING_CENTERS.map(({ color, x, y }) => (
        <GlowOrb
          key={color}
          color={color}
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <img
        src="/dsp-mark-outline.svg"
        alt=""
        className={cn('absolute max-w-none select-none', markClassName)}
        style={{
          left: OLYMPIC_LOGO_CENTER_X_PX,
          top: OLYMPIC_LOGO_CENTER_Y_PX,
          width: Math.min(480, OLYMPIC_CLUSTER_WIDTH_PX * 0.75),
          transform: 'translate(-50%, -50%)',
          aspectRatio: '1 / 1',
          opacity: 0.5,
          zIndex: 1,
        }}
      />
      {centerIcon ? (
        <div
          className="absolute flex size-20 items-center justify-center text-white"
          style={{
            left: OLYMPIC_LOGO_CENTER_X_PX - 4,
            top: OLYMPIC_LOGO_CENTER_Y_PX - 4,
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        >
          {centerIcon}
        </div>
      ) : null}
    </div>
  );
}

function CenterCluster({ markClassName }: { markClassName?: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(254, 226, 226, 0.45) 0%, rgba(255, 255, 255, 0.95) 42%, rgba(255, 255, 255, 0.95) 58%, rgba(209, 250, 229, 0.4) 100%)',
        }}
      />
      <img
        src="/dsp-mark-outline.svg"
        alt=""
        className={cn(
          'absolute top-1/2 left-1/2 w-[480px] max-w-none -translate-x-1/2 select-none sm:w-[720px] lg:w-[960px]',
          markClassName
        )}
        style={{
          transform: 'translate(-50%, calc(-50% + 10px))',
          aspectRatio: '1 / 1',
          opacity: 0.5,
          zIndex: 1,
        }}
      />
      <GlowOrb color="#ef4444" style={{ top: '-20%', left: '-5%' }} />
      <GlowOrb color="#7c3aed" style={{ bottom: '-20%', left: '20%' }} />
      <GlowOrb color="#3b82f6" style={{ top: '-20%', right: '15%' }} />
      <GlowOrb color="#16a34a" style={{ right: '-5%', bottom: '-20%' }} />
    </>
  );
}

/**
 * Brand mark + four color glows.
 * Newsletter uses `center`; coming-soon sections use `right` (top-right Olympic rings).
 */
export function BrandGlowBackdrop({
  className,
  markClassName,
  centerIcon,
  placement = 'center',
}: BrandGlowBackdropProps) {
  const isRight = placement === 'right';

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-visible',
        isRight && '-z-10',
        className
      )}
      aria-hidden
    >
      {isRight ? (
        <RightOlympicCluster markClassName={markClassName} centerIcon={centerIcon} />
      ) : (
        <CenterCluster markClassName={markClassName} />
      )}
    </div>
  );
}
