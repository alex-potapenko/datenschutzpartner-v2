import { cn } from '@/lib/utils';

export const SCAN_BORDER_GRADIENT_STOPS = [
  '#ef4444',
  '#f97316',
  '#7c3aed',
  '#3b82f6',
  '#16a34a',
] as const;

export const scanBorderGradientLinear = `linear-gradient(135deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')})`;
export const scanBorderGradientConic = `conic-gradient(from 0deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')}, ${SCAN_BORDER_GRADIENT_STOPS[0]})`;

/** Spinning conic ring on the pill edge (website scan + status loaders). */
export function ScanPillBorderRing({ active }: { active: boolean }) {
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

/** Outer glow while the scan / status pill is active. */
export function ScanPillGlow({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded-full blur-2xl transition-opacity duration-500',
        active ? 'opacity-50' : 'opacity-0'
      )}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className={cn(
            'absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none',
            active ? 'opacity-100' : 'opacity-0'
          )}
          style={{ background: scanBorderGradientConic }}
        />
      </span>
    </span>
  );
}
