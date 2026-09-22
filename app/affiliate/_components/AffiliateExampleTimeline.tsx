import { getTranslations } from 'next-intl/server';

const STEP_KEYS = ['publish', 'subscribe', 'payout'] as const;

const STEP_MARKER_STYLE = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
} as const;

export async function AffiliateExampleTimeline() {
  const t = await getTranslations('affiliatePage.howItWorks.example');

  return (
    <ol className="flex flex-col" aria-label={t('title')}>
      {STEP_KEYS.map((key, index) => {
        const isLast = index === STEP_KEYS.length - 1;

        return (
          <li key={key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                style={STEP_MARKER_STYLE}
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
