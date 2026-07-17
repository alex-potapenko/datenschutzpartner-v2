import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** White mark and text for accent top bars. */
  inverse?: boolean;
  showText?: boolean;
  /** Overrides the default brand wordmark. */
  text?: string;
}

export function Logo({
  className,
  markClassName,
  textClassName,
  inverse = true,
  showText = true,
  text = 'datenschutzpartner',
}: LogoProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center', showText && 'gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'block size-7 shrink-0 self-center',
          inverse ? 'bg-white' : 'bg-current',
          markClassName
        )}
        style={{
          maskImage: 'url(/dsp-mark.svg)',
          WebkitMaskImage: 'url(/dsp-mark.svg)',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
      {showText ? (
        <span
          className={cn(
            'font-display flex items-center truncate text-sm leading-none font-medium tracking-tight lowercase',
            inverse ? 'text-white' : 'text-current',
            textClassName
          )}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
