'use client';

import { useTranslations } from 'next-intl';
import type { EuRepContract } from '@/api/eu-rep';
import { CheckCircle } from '@/components/ui';
import {
  INSIGHT_META_LABEL_CLASS,
  INSIGHT_META_VALUE_CLASS,
} from '@/app/insights/_components/insight-article-layout';

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
    <div className="flex h-full flex-1 flex-col px-4 pt-10 pb-10 sm:px-8 sm:pt-16">
      <div className="flex max-w-2xl flex-col items-start gap-6 text-left">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={32} weight="fill" className="text-success shrink-0" aria-hidden />
            <h2 className="text-foreground text-xl font-bold sm:text-2xl">
              {tw('alreadyCoveredTitle')}
            </h2>
          </div>
          <p className="text-foreground text-base leading-relaxed">{tw('alreadyCoveredBody')}</p>
        </div>

        <div className="flex flex-col gap-8">
          <MetaBlock label={tc('name')} value={contract.legalEntity} />
          <MetaBlock label={tc('forwardingEmail')} value={contract.forwardingEmail} />
        </div>
      </div>
    </div>
  );
}
