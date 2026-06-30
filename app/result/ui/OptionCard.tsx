import { type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle } from '@/components/ui';

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaIcon?: ReactNode;
  recommended?: boolean;
  onSelect: () => void;
}

export function OptionCard({
  icon,
  title,
  description,
  features,
  ctaLabel,
  ctaIcon,
  recommended,
  onSelect,
}: OptionCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex cursor-pointer flex-col gap-6 rounded-[20px] border p-8 transition-shadow hover:shadow-[0_8px_40px_rgba(0,0,0,0.10)]"
      style={{
        borderColor: recommended ? 'var(--accent)' : 'var(--border)',
        background: recommended ? 'rgba(47,84,134,0.03)' : 'white',
      }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      {recommended && (
        <div
          className="absolute top-4 right-4 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
          style={{ background: 'var(--accent)' }}
        >
          Recommended
        </div>
      )}

      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'rgba(47,84,134,0.08)', color: 'var(--accent)' }}
      >
        {icon}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-xl font-semibold">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="text-foreground flex items-center gap-2 text-sm">
            <CheckCircle
              size={16}
              weight="fill"
              style={{ color: 'var(--accent)', flexShrink: 0 }}
            />
            {f}
          </li>
        ))}
      </ul>

      <Button
        variant={recommended ? 'primary' : 'outline'}
        size="lg"
        className="mt-auto w-full gap-2 rounded-full"
        onPress={onSelect}
      >
        {ctaLabel}
        {ctaIcon}
      </Button>
    </div>
  );
}
