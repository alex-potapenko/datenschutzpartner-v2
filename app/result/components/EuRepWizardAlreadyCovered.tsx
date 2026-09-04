'use client';

import { useTranslations } from 'next-intl';
import type { EuRepContract } from '@/api/eu-rep';
import {
  INSIGHT_META_LABEL_CLASS,
  INSIGHT_META_VALUE_CLASS,
} from '@/app/insights/_components/insight-article-layout';
import { EuRepWizardCoveredSection } from './EuRepWizardCoveredSection';

type EuRepWizardAlreadyCoveredProps = {
  contract: EuRepContract;
};

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={INSIGHT_META_LABEL_CLASS}>{label}</span>
      <p className={INSIGHT_META_VALUE_CLASS}>{value}</p>
    </div>
  );
}

export function EuRepWizardAlreadyCovered({ contract }: EuRepWizardAlreadyCoveredProps) {
  const tw = useTranslations('result.euRepStep');
  const tc = useTranslations('account.euRep.contract');

  return (
    <EuRepWizardCoveredSection
      variant="page"
      title={tw('alreadyCoveredTitle')}
      body={tw('alreadyCoveredBody')}
    >
      <div className="flex flex-col gap-8">
        <MetaBlock label={tc('name')} value={contract.legalEntity} />
        <MetaBlock label={tc('forwardingEmail')} value={contract.forwardingEmail} />
      </div>
    </EuRepWizardCoveredSection>
  );
}
