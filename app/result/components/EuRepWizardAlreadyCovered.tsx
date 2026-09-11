'use client';

import { useTranslations } from 'next-intl';
import type { EuRepContract } from '@/api/eu-rep';
import { EuRepWizardCoveredSection } from './EuRepWizardCoveredSection';

type EuRepWizardAlreadyCoveredProps = {
  contract: EuRepContract;
};

export function EuRepWizardAlreadyCovered({ contract }: EuRepWizardAlreadyCoveredProps) {
  const tw = useTranslations('result.euRepStep');

  return (
    <EuRepWizardCoveredSection
      variant="page"
      title={tw('gotYouCovered')}
      body={tw.rich('alreadyCoveredBodyLogged', {
        legalEntity: contract.legalEntity,
        entity: (chunks) => <span className="font-semibold">{chunks}</span>,
      })}
    >
      <p className="text-foreground text-base leading-relaxed">
        {tw('alreadyCoveredForwardingEmail')}:{' '}
        <span className="font-semibold">{contract.forwardingEmail}</span>
      </p>
    </EuRepWizardCoveredSection>
  );
}
