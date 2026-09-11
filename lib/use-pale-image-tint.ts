'use client';

import { useEffect, useState } from 'react';

const NEUTRAL_TINT = 'color-mix(in srgb, var(--foreground) 6%, transparent)';

function averageOpaqueRgb(data: Uint8ClampedArray): [number, number, number] | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 0;
    if (alpha < 24) continue;
    r += data[index] ?? 0;
    g += data[index + 1] ?? 0;
    b += data[index + 2] ?? 0;
    count += 1;
  }

  if (count === 0) return null;
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

/** Samples a remote logo and returns a pale tint for its container background. */
export function usePaleImageTint(src: string | undefined) {
  const [tint, setTint] = useState(NEUTRAL_TINT);

  useEffect(() => {
    if (!src) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        context.drawImage(image, 0, 0, 16, 16);
        const average = averageOpaqueRgb(context.getImageData(0, 0, 16, 16).data);
        if (!average) return;

        const [r, g, b] = average;
        setTint(`color-mix(in srgb, rgb(${r} ${g} ${b}) 12%, white)`);
      } catch {
        setTint(NEUTRAL_TINT);
      }
    };

    image.onerror = () => {
      setTint(NEUTRAL_TINT);
    };

    image.src = src;
  }, [src]);

  return src ? tint : NEUTRAL_TINT;
}

export { NEUTRAL_TINT };
