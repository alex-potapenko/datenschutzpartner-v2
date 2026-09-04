'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Globe } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { ScanForm } from '@/components/shared/ScanForm';
import { SCAN_DURATION_MS } from '../content/scan-groups';
import { useScanLoadingPhase } from '../content/use-scan-loading-phase';
import { StepFrame } from '../ui/StepFrame';

interface ScanStepProps {
  domain: string;
  onContinue: () => void;
  skipLoading?: boolean;
}

export function ScanStep({ domain, onContinue, skipLoading }: ScanStepProps) {
  const t = useTranslations('result.scanStep');
  const phase = useScanLoadingPhase(!skipLoading);
  const scanningLabel = phase === 'scanning' ? t('scanningWebsite') : t('creatingPolicy');
  const scanningIcon = phase === 'scanning' ? Globe : FileText;

  useEffect(() => {
    if (skipLoading) {
      onContinue();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onContinue();
    }, SCAN_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onContinue, skipLoading]);

  if (skipLoading) {
    return (
      <StepFrame centerContent>
        <div className="flex flex-1" />
      </StepFrame>
    );
  }

  return (
    <StepFrame centerContent>
      <Container className="flex h-full flex-1 flex-col">
        <div className="border-border relative flex h-full flex-1 items-center justify-center overflow-x-hidden border-r border-l px-4 py-16 sm:px-8 sm:py-24">
          <ScanForm
            scanning
            scanningLabel={scanningLabel}
            scanningIcon={scanningIcon}
            scanningPhaseKey={phase}
            displayValue={domain}
          />
        </div>
      </Container>
    </StepFrame>
  );
}
