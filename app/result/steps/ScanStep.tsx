'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DotmCircular12 } from '@/components/ui/dotm-circular-12';
import { Container } from '@/components/shared/Container';
import { StepFrame } from '../ui/StepFrame';

import { SCAN_ITEM_COUNT } from '../content/scan-groups';

interface ScanStepProps {
  domain: string;
  onContinue: () => void;
  skipLoading?: boolean;
}

export function ScanStep({ domain, onContinue, skipLoading }: ScanStepProps) {
  const t = useTranslations('result.scanStep');
  const [scannedCount, setScannedCount] = useState(skipLoading ? SCAN_ITEM_COUNT : 0);

  useEffect(() => {
    if (skipLoading) return;

    let count = 0;

    const interval = window.setInterval(
      () => {
        count++;
        setScannedCount(count);
        if (count >= SCAN_ITEM_COUNT) window.clearInterval(interval);
      },
      Math.max(1, Math.round(12000 / SCAN_ITEM_COUNT))
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [skipLoading]);

  const isComplete = scannedCount >= SCAN_ITEM_COUNT;

  useEffect(() => {
    if (!isComplete || skipLoading) return;

    const timeoutId = window.setTimeout(() => {
      onContinue();
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isComplete, skipLoading, onContinue]);

  return (
    <StepFrame centerContent>
      <Container className="flex h-full flex-1 flex-col">
        <div className="border-border flex h-full flex-1 flex-col items-center justify-center overflow-x-hidden border-r border-l px-4 py-16 sm:px-8 sm:py-24">
          <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
            {!isComplete ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-accent" role="status" aria-live="polite">
                  <span className="sr-only">{t('scanningDescription')}</span>
                  <DotmCircular12 size={48} dotSize={6} aria-hidden />
                </div>
                <h1 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
                  {t('scanningTitle', { domain })}
                </h1>
                <p className="text-muted max-w-lg text-base leading-relaxed">
                  {t('scanningDescription')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </StepFrame>
  );
}
