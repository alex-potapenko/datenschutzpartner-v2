'use client';

import { useTranslations } from 'next-intl';

const STEP_KEYS = ['publish', 'subscribe', 'payout'] as const;

export function AffiliateProgramExampleTimeline() {
  const t = useTranslations('affiliatePage.howItWorks.example');

  return (
    <ol className="flex flex-col" aria-label={t('title')}>
      {STEP_KEYS.map((key, index) => {
        const isLast = index === STEP_KEYS.length - 1;

        return (
          <li key={key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className="bg-key-500 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </div>
              {isLast ? null : (
                <div
                  className="my-1 min-h-8 w-px flex-1"
                  style={{ background: 'var(--border)' }}
                  aria-hidden
                />
              )}
            </div>
            <div className={isLast ? 'pt-0.5' : 'pt-0.5 pb-8'}>
              <p className="text-foreground text-base font-semibold">{t(`steps.${key}.title`)}</p>
              <p className="text-muted mt-1 text-base leading-relaxed">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
