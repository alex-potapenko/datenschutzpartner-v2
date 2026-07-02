'use client';

import { useTranslations } from 'next-intl';
import { EuRepBenefitsPanel } from '@/app/eu-rep/_components/EuRepBenefitsPanel';
import { EuRepStatsRowPanel } from '@/app/eu-rep/_components/EuRepStatsRowPanel';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';

interface EuRepStepProps {
  onSelect: (plan: 'budget' | 'standard' | 'premium') => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export function EuRepStep({ onSelect, onSkip, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');

  return (
    <>
      <StepHeader
        title={t('title')}
        description={t.rich('description', {
          art27: (chunks) => (
            <a
              href="https://gdpr-info.eu/art-27-gdpr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {chunks}
            </a>
          ),
        })}
      />

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
