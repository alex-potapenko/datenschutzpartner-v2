'use client';

import { useEffect, useState } from 'react';

const LAYERS = [
  { key: 'glow', label: 'glow', selector: '[data-hero-glow]', initial: 0 },
  { key: 'orbits', label: 'orbits', selector: '[data-hero-orbit-lines]', initial: 1 },
  { key: 'icons', label: 'icons', selector: '[data-hero-orbit-icons]', initial: 2 },
] as const;

function LayerControl({ label, selector, initial }: Omit<(typeof LAYERS)[number], 'key'>) {
  const [zIndex, setZIndex] = useState<number>(initial);

  useEffect(() => {
    const layer = document.querySelector<HTMLElement>(selector);
    if (!layer) return;

    if (zIndex === initial) {
      layer.style.removeProperty('z-index');
      return;
    }

    layer.style.zIndex = String(zIndex);
  }, [initial, selector, zIndex]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`Decrease ${label} z-index`}
        onClick={() => {
          setZIndex((value) => value - 1);
        }}
        className="hover:bg-back8 size-7 rounded-full text-base leading-none font-medium"
      >
        −
      </button>
      <span className="text-muted w-16 text-center text-xs tabular-nums">
        {label} {zIndex}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label} z-index`}
        onClick={() => {
          setZIndex((value) => value + 1);
        }}
        className="hover:bg-back8 size-7 rounded-full text-base leading-none font-medium"
      >
        +
      </button>
    </div>
  );
}

/** Dev-only control to find the right stacking order for the hero background layers. */
export function HeroLayerZDebug() {
  return (
    <div className="border-border fixed bottom-4 left-4 z-[9999] flex flex-col gap-1 rounded-2xl border bg-white/95 p-1 shadow-lg backdrop-blur">
      {LAYERS.map(({ key, ...layer }) => (
        <LayerControl key={key} {...layer} />
      ))}
    </div>
  );
}
