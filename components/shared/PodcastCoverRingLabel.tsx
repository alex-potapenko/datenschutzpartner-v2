'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

const RING_RADIUS = 44;
const CENTER = 50;
const LEFT_X = CENTER - RING_RADIUS;
const RIGHT_X = CENTER + RING_RADIUS;
const RING_ROTATION_DEG = 45;
/** ~4px nudge at default ring size (viewBox 0–100). */
const BULLET_NUDGE_X = 2;
const BULLET_NUDGE_Y = 2;

type RingBullet = {
  /** On the ring in label space: 0° = 3 o'clock, 90° = 6 o'clock (before RING_ROTATION_DEG). */
  angleDeg: number;
  /** Fine-tune in viewBox units after polar placement. */
  offsetX?: number;
  offsetY?: number;
};

/** Manual bullet placement — edit angles and offsets here. */
const BULLETS: RingBullet[] = [
  { angleDeg: 180, offsetX: 0, offsetY: 0 },
  { angleDeg: 0, offsetX: 0, offsetY: 0 },
];

function ringPoint(angleDeg: number, radius = RING_RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function bulletX(bullet: RingBullet, x: number) {
  return x + (bullet.offsetX ?? 0) + BULLET_NUDGE_X;
}

function bulletY(bullet: RingBullet, y: number) {
  return y + (bullet.offsetY ?? 0) + BULLET_NUDGE_Y;
}

type PodcastCoverRingLabelProps = {
  word1: string;
  word2: string;
  className?: string;
};

const textProps = {
  fill: 'currentColor',
  className: 'text-accent font-display font-semibold uppercase',
  style: { fontSize: 9.25, letterSpacing: '0.44em' },
} as const;

/** Curved label around the podcast cover microphone — no glyph stretching. */
export function PodcastCoverRingLabel({ word1, word2, className }: PodcastCoverRingLabelProps) {
  const topArcId = useId().replace(/:/g, '');

  const topArc = `M ${LEFT_X},${CENTER} A ${RING_RADIUS},${RING_RADIUS} 0 0,1 ${RIGHT_X},${CENTER}`;

  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 size-full overflow-visible', className)}
      viewBox="0 0 100 100"
      overflow="visible"
      aria-hidden
    >
      <defs>
        <path id={topArcId} d={topArc} fill="none" />
      </defs>

      <g transform={`rotate(${RING_ROTATION_DEG}, ${CENTER}, ${CENTER})`}>
        <text {...textProps}>
          <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
            {word1}
          </textPath>
        </text>

        <g transform={`rotate(180, ${CENTER}, ${CENTER})`}>
          <text {...textProps}>
            <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
              {word2}
            </textPath>
          </text>
        </g>

        {BULLETS.map((bullet, index) => {
          const { x, y } = ringPoint(bullet.angleDeg);

          return (
            <text
              key={index}
              {...textProps}
              textAnchor="middle"
              dominantBaseline="central"
              x={bulletX(bullet, x)}
              y={bulletY(bullet, y)}
            >
              •
            </text>
          );
        })}
      </g>
    </svg>
  );
}
