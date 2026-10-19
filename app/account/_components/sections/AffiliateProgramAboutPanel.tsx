'use client';

import { useTranslations } from 'next-intl';
import { AffiliateProgramExampleTimeline } from '@/components/shared/affiliate/AffiliateProgramExampleTimeline';
import { AffiliateProgramStats } from '@/components/shared/affiliate/AffiliateProgramStats';
import { AccountSection } from '../account-ui';

/** Partner “About” tab — program stats and how-it-works steps (no registration form). */
export function AffiliateProgramAboutPanel() {
  const t = useTranslations('affiliatePage.howItWorks');

  return (
    <AccountSection className="px-0 pt-0" contentClassName="gap-0">
      <AffiliateProgramStats embeddedInAccount />
      <div className="flex flex-col gap-3 px-4 pt-8 sm:px-8">
        <h2 className="text-foreground text-xl font-bold sm:text-2xl">{t('title')}</h2>
      </div>
      <div className="flex max-w-xl flex-col gap-8 px-4 pt-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
        <AffiliateProgramExampleTimeline />
      </div>
    </AccountSection>
  );
}
