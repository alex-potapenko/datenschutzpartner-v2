'use client';

import { Fragment, useEffect, useId, useRef, type ComponentType, type CSSProperties } from 'react';
import { useAnimationFrame, useReducedMotion } from 'motion/react';
import {
  Camera,
  ChartBar,
  Cloud,
  Cookie,
  CreditCard,
  Crosshair,
  Database,
  EnvelopeSimple,
  Eye,
  FileText,
  Globe,
  Lock,
  MapPin,
  ShieldCheck,
  ShareNetwork,
} from '@/components/ui';

/** The star is invisible and sits on the bottom edge, centred — only its orbits show. */
const CENTRE_X = 0.5;
const CENTRE_Y = 1;
/** Lifts the whole system off the hero's bottom edge. */
const CENTRE_OFFSET_Y = -196;
const ORBIT_GAP = 160;
const ORBIT_COUNT = 6;
const ORBIT_INNER_RADIUS = 160;

const ORBIT_RADII = Array.from(
  { length: ORBIT_COUNT },
  (_, index) => ORBIT_INNER_RADIUS + index * ORBIT_GAP
);

/** How far the orbits are allowed to bleed into the section below the hero. */
const BLEED = 400;

/** How far the orbits are allowed to bleed over the copy column, mirroring BLEED. */
const COPY_BLEED = 110;

/** Container is max-w-7xl (1280px), so the copy column runs from `50% - 640px` to the centre line. */
const COPY_COLUMN_MASK = [
  'linear-gradient(to right',
  'black 0',
  'black calc(50% - 900px)',
  'transparent calc(50% - 560px)',
  `transparent calc(50% - ${8 + COPY_BLEED}px)`,
  'black calc(50% + 150px))',
].join(', ');

/** The card grid below the hero: max-w-7xl (1280px) minus the 2×32px container padding. */
const CARD_GRID_HALF_WIDTH = 608;

/** Keeps the bleed in the gutters beside the card grid, never on the cards themselves. */
const CARD_GUTTER_MASK = [
  'linear-gradient(to right',
  'black 0',
  `black calc(50% - ${CARD_GRID_HALF_WIDTH}px)`,
  `transparent calc(50% - ${CARD_GRID_HALF_WIDTH}px)`,
  `transparent calc(50% + ${CARD_GRID_HALF_WIDTH}px)`,
  `black calc(50% + ${CARD_GRID_HALF_WIDTH}px))`,
].join(', ');

/** The hero itself — the layer runs BLEED past it, so its bottom edge sits at 100% - BLEED. */
const HERO_MASK = `linear-gradient(to bottom, black 0, black calc(100% - ${BLEED}px), transparent calc(100% - ${BLEED}px))`;

/** The band under the hero, fading out on its way down. */
const BLEED_MASK = [
  'linear-gradient(to bottom',
  'transparent 0',
  `transparent calc(100% - ${BLEED}px)`,
  `black calc(100% - ${BLEED}px)`,
  'transparent 100%)',
].join(', ');

/** Copy column ∩ (hero ∪ gutter bleed) — mask layers fold from the bottom of the list up. */
const LAYER_MASK_IMAGE = `${COPY_COLUMN_MASK}, ${HERO_MASK}, ${CARD_GUTTER_MASK}, ${BLEED_MASK}`;

const LAYER_MASK = {
  WebkitMaskImage: LAYER_MASK_IMAGE,
  WebkitMaskComposite: 'source-in, source-over, source-in, source-over',
  maskImage: LAYER_MASK_IMAGE,
  maskComposite: 'intersect, add, intersect, add',
} as const;

const TRAIL_RATIO = 0.42;
const TRAIL_MAX = 240;
const TAU = Math.PI * 2;

const ICON_SIZE_MIN = 40;
const ICON_SIZE_MAX = 60;

function stableIconSize(key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const span = ICON_SIZE_MAX - ICON_SIZE_MIN + 1;
  return ICON_SIZE_MIN + (Math.abs(hash) % span);
}

type Planet = {
  key: string;
  icon: ComponentType<{ color?: string; className?: string; style?: CSSProperties }>;
  color: string;
  orbit: number;
  /** Start offset along the orbit, 0–1. */
  phase: number;
  /** Traversals per second. */
  speed: number;
  size: number;
};

const PLANET_CONFIGS = [
  { key: 'website', icon: Globe, color: '#2563eb', orbit: 0, phase: 0.15, speed: 0.038 },
  { key: 'location', icon: MapPin, color: '#dc2626', orbit: 0, phase: 0.68, speed: 0.038 },
  { key: 'tracking', icon: Crosshair, color: '#ef4444', orbit: 1, phase: 0.1, speed: 0.032 },
  { key: 'dataStorage', icon: Database, color: '#0ea5e9', orbit: 1, phase: 0.62, speed: 0.032 },
  { key: 'hosting', icon: Cloud, color: '#3b82f6', orbit: 2, phase: 0.34, speed: 0.026 },
  { key: 'cookies', icon: Cookie, color: '#d97706', orbit: 2, phase: 0.86, speed: 0.026 },
  { key: 'analytics', icon: ChartBar, color: '#7c3aed', orbit: 3, phase: 0.18, speed: 0.021 },
  { key: 'payment', icon: CreditCard, color: '#6366f1', orbit: 3, phase: 0.7, speed: 0.021 },
  { key: 'policy', icon: FileText, color: '#0d9488', orbit: 4, phase: 0.45, speed: 0.017 },
  { key: 'mediaCapture', icon: Camera, color: '#db2777', orbit: 4, phase: 0.92, speed: 0.017 },
  { key: 'consent', icon: ShieldCheck, color: '#059669', orbit: 1, phase: 0.36, speed: 0.032 },
  { key: 'newsletter', icon: EnvelopeSimple, color: '#0891b2', orbit: 2, phase: 0.6, speed: 0.026 },
  { key: 'encryption', icon: Lock, color: '#4f46e5', orbit: 3, phase: 0.94, speed: 0.021 },
  { key: 'surveillance', icon: Eye, color: '#c026d3', orbit: 5, phase: 0.28, speed: 0.014 },
  { key: 'sharing', icon: ShareNetwork, color: '#9333ea', orbit: 5, phase: 0.74, speed: 0.014 },
] as const;

const PLANETS: Planet[] = PLANET_CONFIGS.map((planet) => ({
  ...planet,
  size: stableIconSize(planet.key),
}));

type OrbitGeometry = {
  radius: number;
  circumference: number;
  trailLength: number;
  /** Mask radius that reaches transparent right where the trail ends. */
  trailFadeRadius: number;
};

type Geometry = {
  width: number;
  height: number;
  centre: { x: number; y: number };
  orbits: OrbitGeometry[];
};

function pointOn(centre: { x: number; y: number }, radius: number, angle: number) {
  return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
}

function measure(width: number, height: number): Geometry {
  const centre = { x: width * CENTRE_X, y: height * CENTRE_Y + CENTRE_OFFSET_Y };

  const orbits = ORBIT_RADII.map((radius) => {
    const circumference = TAU * radius;
    const trailLength = Math.min(TRAIL_MAX, circumference * TRAIL_RATIO);

    return {
      radius,
      circumference,
      trailLength,
      trailFadeRadius: chordLength(radius, trailLength),
    };
  });

  return { width, height, centre, orbits };
}

function setCircleGeometry(
  element: SVGCircleElement | null,
  centre: { x: number; y: number },
  radius: number
) {
  if (!element) return;
  element.setAttribute('cx', centre.x.toFixed(2));
  element.setAttribute('cy', centre.y.toFixed(2));
  element.setAttribute('r', radius.toFixed(2));
}

function wrap(value: number, period: number) {
  return ((value % period) + period) % period;
}

/** Straight-line distance between the two ends of an arc — used to size the fade mask. */
function chordLength(radius: number, arcLength: number) {
  return 2 * radius * Math.sin(arcLength / (2 * radius));
}

export function HeroOrbitSystem() {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const prefersReducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<Geometry | null>(null);
  const orbitCirclesRef = useRef<(SVGCircleElement | null)[]>([]);
  const trailCirclesRef = useRef(new Map<string, SVGCircleElement | null>());
  const trailMasksRef = useRef(new Map<string, SVGCircleElement | null>());
  const iconsRef = useRef(new Map<string, HTMLDivElement | null>());

  const draw = (elapsedSeconds: number) => {
    const geometry = geometryRef.current;
    if (!geometry) return;

    for (const planet of PLANETS) {
      const orbit = geometry.orbits[planet.orbit];
      const icon = iconsRef.current.get(planet.key);
      const trail = trailCirclesRef.current.get(planet.key);
      const mask = trailMasksRef.current.get(planet.key);
      if (!orbit || !icon) continue;

      const progress = (elapsedSeconds * planet.speed + planet.phase) % 1;
      const angle = progress * TAU;
      const point = pointOn(geometry.centre, orbit.radius, angle);
      const travelled = progress * orbit.circumference;

      icon.style.transform = `translate3d(${point.x.toFixed(2)}px, ${point.y.toFixed(2)}px, 0) translate(-50%, -50%)`;

      if (trail) {
        // The dash pattern spans exactly one full turn, so the trail wraps without a seam.
        trail.setAttribute(
          'stroke-dasharray',
          `${orbit.trailLength.toFixed(2)} ${(orbit.circumference - orbit.trailLength).toFixed(2)}`
        );
        // Puts the leading end of the dash exactly under the icon.
        const dashoffset = wrap(orbit.trailLength - travelled, orbit.circumference);
        trail.setAttribute('stroke-dashoffset', dashoffset.toFixed(2));
      }

      if (mask) {
        mask.setAttribute('cx', point.x.toFixed(2));
        mask.setAttribute('cy', point.y.toFixed(2));
        mask.setAttribute('r', orbit.trailFadeRadius.toFixed(2));
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const applyGeometry = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;

      const geometry = measure(width, height);
      geometryRef.current = geometry;

      geometry.orbits.forEach((orbit, index) => {
        setCircleGeometry(orbitCirclesRef.current[index] ?? null, geometry.centre, orbit.radius);
      });

      for (const planet of PLANETS) {
        const orbit = geometry.orbits[planet.orbit];
        if (!orbit) continue;
        setCircleGeometry(
          trailCirclesRef.current.get(planet.key) ?? null,
          geometry.centre,
          orbit.radius
        );
      }

      draw(0);
    };

    applyGeometry();
    const observer = new ResizeObserver(applyGeometry);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useAnimationFrame((time) => {
    if (prefersReducedMotion) return;
    draw(time / 1000);
  });

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0">
      {/* Only the grey rings bleed into the next section, fading out as they go. */}
      <div
        data-hero-orbit-lines
        className="absolute inset-x-0 top-0 z-[11]"
        style={{ bottom: -BLEED, ...LAYER_MASK }}
      >
        <svg className="absolute inset-0 size-full overflow-visible" fill="none">
          {ORBIT_RADII.map((_, index) => (
            <circle
              key={index}
              ref={(element) => {
                orbitCirclesRef.current[index] = element;
              }}
              fill="none"
              stroke="#000"
              strokeOpacity={0.06}
              strokeWidth={1.2}
            />
          ))}
        </svg>
      </div>

      {/* Trails and icons share one clipped layer, so an icon always covers its own trail. */}
      <div
        data-hero-orbit-icons
        className="absolute inset-0 z-[12] overflow-hidden"
        style={{ maskImage: COPY_COLUMN_MASK, WebkitMaskImage: COPY_COLUMN_MASK }}
      >
        <svg className="absolute inset-0 size-full overflow-visible" fill="none">
          <defs>
            {PLANETS.map((planet) => (
              <Fragment key={planet.key}>
                <radialGradient id={`${id}-${planet.key}-fade`} gradientUnits="objectBoundingBox">
                  <stop offset="0" stopColor="#fff" stopOpacity="1" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id={`${id}-${planet.key}-trail`} maskUnits="userSpaceOnUse">
                  <circle
                    ref={(element) => {
                      trailMasksRef.current.set(planet.key, element);
                    }}
                    fill={`url(#${id}-${planet.key}-fade)`}
                  />
                </mask>
              </Fragment>
            ))}
          </defs>

          {PLANETS.map((planet) => (
            <circle
              key={planet.key}
              ref={(element) => {
                trailCirclesRef.current.set(planet.key, element);
              }}
              fill="none"
              stroke={planet.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              mask={`url(#${id}-${planet.key}-trail)`}
            />
          ))}
        </svg>

        {PLANETS.map((planet) => {
          const Icon = planet.icon;
          const glyphSize = Math.round(planet.size * 0.45);

          return (
            <div
              key={planet.key}
              ref={(element) => {
                iconsRef.current.set(planet.key, element);
              }}
              className="absolute top-0 left-0 flex items-center justify-center rounded-full bg-white shadow-[0_6px_20px_rgba(15,23,42,0.12)]"
              style={{ width: planet.size, height: planet.size, willChange: 'transform' }}
            >
              <Icon color={planet.color} style={{ width: glyphSize, height: glyphSize }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
