'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EuRepBenefitsPanel } from '@/app/eu-rep/_components/EuRepBenefitsPanel';
import { EuRepHeroContent } from '@/app/eu-rep/_components/EuRepHeroContent';
import { EuRepStatsRowPanel } from '@/app/eu-rep/_components/EuRepStatsRowPanel';
import { buildResultReturnTo } from '@/app/result/wizard-state';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';

interface EuRepStepProps {
  onSelect: (plan: 'budget' | 'standard' | 'premium') => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export function EuRepStep({ onSelect, onSkip, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');
  const searchParams = useSearchParams();
  const questionnaireReturnTo = useMemo(
    () => buildResultReturnTo(searchParams, 'eu-rep'),
    [searchParams]
  );

  return (
    <>
      <div className="border-border border-b">
        <Container>
          <div className="border-border border-r border-l">
            <EuRepHeroContent showImage={false} questionnaireReturnTo={questionnaireReturnTo} />
          </div>
        </Container>
      </div>

      <div className="flex flex-1 flex-col">
        <Container>
          <div className="border-border border-r border-l">
            <EuRepStatsRowPanel />
            <EuRepBenefitsPanel
              showBottomBorder={false}
              onChoose={onSelect}
              chooseLabels={{
                budget: t('chooseBudget'),
                standard: t('chooseStandard'),
                premium: t('choosePremium'),
              }}
            />
          </div>
        </Container>
      </div>

      <StepFooter onBack={onBack} onSkip={onSkip} skipLabel={t('skip')} />
    </>
  );
}
