import { getTranslations } from 'next-intl/server';

const STAT_KEYS = ['webinars', 'events', 'recordings', 'frameworks'] as const;

const STAT_BORDER_CLASSES = [
  'border-border border-b sm:border-r sm:border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0 lg:border-r',
  'border-border border-b sm:border-r sm:border-b-0 lg:border-r',
  '',
];

export async function AcademyStatsRow() {
  const t = await getTranslations('academy.landing.stats');

  return (
    <section className="border-border border-b" aria-label={t('ariaLabel')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_KEYS.map((key, index) => (
          <div
            key={key}
            className={['flex flex-col gap-2 p-4 sm:p-6 lg:p-8', STAT_BORDER_CLASSES[index]].join(
              ' '
            )}
          >
            <span
              className="font-display text-3xl leading-none font-bold tabular-nums sm:text-4xl"
              style={{ color: 'var(--accent)' }}
            >
              {t(`${key}.value`)}
            </span>
            <p className="text-muted text-sm leading-snug">{t(`${key}.label`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
