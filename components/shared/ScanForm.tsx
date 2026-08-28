'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Globe, Sparkle, cn } from '@/components/ui';
import { Button } from '@/components/ui';

const SCAN_BORDER_GRADIENT_STOPS = ['#ef4444', '#f97316', '#7c3aed', '#3b82f6', '#16a34a'] as const;
const scanBorderGradientLinear = `linear-gradient(135deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')})`;
const scanBorderGradientConic = `conic-gradient(from 0deg, ${SCAN_BORDER_GRADIENT_STOPS.join(', ')}, ${SCAN_BORDER_GRADIENT_STOPS[0]})`;

interface ScanFormProps {
  dark?: boolean;
  className?: string;
  /** Prepaid policy subscription slot to fill after scan. */
  fillSubscriptionId?: string;
}

export function ScanForm({ dark, className, fillSubscriptionId }: ScanFormProps) {
  const router = useRouter();
  const t = useTranslations('landing');
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    const params = new URLSearchParams({ url: normalized });
    if (fillSubscriptionId) {
      params.set('fillSubscription', fillSubscriptionId);
    }
    router.push(`/result?${params.toString()}`);
  }

  return (
    <form
      id="scan-form"
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:bg-white sm:p-3 sm:py-3 sm:pr-3 sm:pl-6 sm:shadow-[0_4px_32px_rgba(0,0,0,0.10)]',
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-full bg-white px-4 py-4 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:contents">
        <Globe
          size={24}
          weight="regular"
          className="shrink-0 sm:mr-3"
          style={{ color: 'var(--accent)' }}
        />
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
          }}
          placeholder={t('scanPlaceholder')}
          aria-label={t('scanUrlAria')}
          className={[
            'min-w-0 flex-1 bg-transparent text-base font-semibold outline-none sm:text-lg',
            dark
              ? 'text-white placeholder:text-white/40 focus:placeholder:text-transparent'
              : 'text-[var(--accent)] placeholder:text-[var(--accent)] focus:placeholder:text-transparent',
          ].join(' ')}
        />
      </div>
      <div
        className="group relative h-12 w-full shrink-0 rounded-full p-[3px] sm:h-14 sm:w-auto"
        style={{ background: scanBorderGradientLinear }}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
          aria-hidden
        >
          <div
            className="absolute top-1/2 left-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 group-hover:animate-[spin_1.2s_linear_infinite] motion-reduce:group-hover:animate-none"
            style={{ background: scanBorderGradientConic }}
          />
          <span className="absolute inset-0 bg-white/30 mix-blend-screen" />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="relative z-10 h-full min-h-0 w-full gap-2 rounded-full border-0 bg-[#2F5486] text-base sm:w-auto sm:text-lg"
        >
          <Sparkle size={18} weight="fill" />
          {t('scanButton')}
        </Button>
      </div>
    </form>
  );
}
