'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle } from '@/components/ui';

const STAT_KEYS = ['legallyReviewed', 'frameworks', 'flexibleUse', 'longTerm'] as const;

const STAT_BORDER_CLASSES = [
  'border-border border-b sm:border-r sm:border-b lg:border-b-0 lg:border-r',
  'border-border border-b lg:border-b-0 lg:border-r',
  'border-border border-b sm:border-r sm:border-b-0 lg:border-r',
  '',
];

export function GeneratorStatsRowPanel() {
  const t = useTranslations('generatorPage.stats');

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
            <CheckCircle
              size={36}
              weight="fill"
              aria-hidden
              className="sm:size-11 lg:size-12"
              style={{ color: 'var(--success)' }}
            />
            <p className="text-foreground text-sm leading-snug font-semibold">
              {t(`${key}.title`)}
            </p>
            <p className="text-muted text-sm leading-snug">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
