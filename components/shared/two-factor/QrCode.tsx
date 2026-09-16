'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

/**
 * Local seam over the `qrcode` package. `create` is synchronous, so the matrix
 * can be turned into an SVG path during render — no effect, no loading state.
 */
export function QrCode({
  value,
  size = 200,
  label,
  className,
}: {
  value: string;
  size?: number;
  label: string;
  className?: string;
}) {
  const { path, moduleCount } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const segments: string[] = [];

    for (let row = 0; row < modules.size; row += 1) {
      for (let column = 0; column < modules.size; column += 1) {
        if (modules.data[row * modules.size + column]) {
          segments.push(`M${String(column)},${String(row)}h1v1h-1z`);
        }
      }
    }

    return { path: segments.join(''), moduleCount: modules.size };
  }, [value]);

  // One quiet-zone module on each side keeps scanners reliable.
  const viewBoxSize = moduleCount + 2;

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${String(viewBoxSize)} ${String(viewBoxSize)}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="white" />
      <g transform="translate(1, 1)" fill="currentColor">
        <path d={path} />
      </g>
    </svg>
  );
}
