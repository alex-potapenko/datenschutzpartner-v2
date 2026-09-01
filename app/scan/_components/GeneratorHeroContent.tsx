'use client';

import { useTranslations } from 'next-intl';
import { FileText, cn } from '@/components/ui';
import { ScanForm } from '@/components/shared/ScanForm';

type GeneratorHeroContentProps = {
  fillSubscriptionId?: string;
  initialDomain?: string;
  showImage?: boolean;
};

export function GeneratorHeroContent({
  fillSubscriptionId,
  initialDomain,
  showImage = true,
}: GeneratorHeroContentProps) {
  const t = useTranslations('generatorPage');
  const initialUrl = initialDomain
    ? initialDomain.startsWith('http')
      ? initialDomain
      : `https://${initialDomain}`
    : undefined;

  return (
    <div
      className={cn('border-border', showImage ? 'grid items-stretch lg:grid-cols-2' : 'w-full')}
    >
      <div
        className={cn(
          'flex w-full min-w-0 flex-col',
          showImage && 'border-border order-2 border-t lg:order-1 lg:border-t-0 lg:border-r'
        )}
      >
        <div className="flex w-full flex-col gap-6 px-4 pt-12 pb-6 sm:gap-8 sm:px-8 sm:pt-20 sm:pb-8">
          <div className="flex flex-col gap-2">
            <p
              className="font-display inline-flex items-center gap-2 text-base font-medium"
              style={{ color: 'var(--accent)' }}
            >
              <FileText size={24} weight="fill" aria-hidden />
              {t('eyebrow')}
            </p>
            <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
              {t('title')}
            </h1>
          </div>

          <p className="text-foreground max-w-xl text-base leading-relaxed sm:text-lg">
            {t.rich('heroIntro', {
              fadp: (chunks) => <strong className="font-semibold">{chunks}</strong>,
              gdpr: (chunks) => <strong className="font-semibold">{chunks}</strong>,
            })}
          </p>
          {fillSubscriptionId ? (
            <p className="text-muted max-w-xl text-sm leading-relaxed">
              {t('fillSlotScanNote', { id: fillSubscriptionId })}
            </p>
          ) : null}
        </div>

        <div className="relative z-10 px-4 pb-8 sm:px-8 sm:pb-10 lg:-mx-9 lg:px-0 lg:pl-2">
          <ScanForm fillSubscriptionId={fillSubscriptionId} initialUrl={initialUrl} />
        </div>
      </div>

      {showImage ? (
        <div
          role="img"
          aria-label={t('heroImageAlt')}
          className="relative order-1 aspect-[2/1] w-full bg-cover bg-center lg:order-2 lg:aspect-auto lg:min-h-[320px]"
          style={{ backgroundImage: "url('/team.webp')" }}
        />
      ) : null}
    </div>
  );
}
