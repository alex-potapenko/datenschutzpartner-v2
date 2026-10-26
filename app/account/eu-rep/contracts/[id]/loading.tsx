import { getTranslations } from 'next-intl/server';
import { EU_REP_ACCOUNT_HREF } from '@/app/account/_components/account-sections';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { ScanLoader } from '@/components/shared/ScanLoader';

export default async function EuRepContractDetailLoading() {
  const t = await getTranslations('account');
  const tCommon = await getTranslations('common');

  return (
    <PolicyDetailPageShell
      backHref={EU_REP_ACCOUNT_HREF}
      backLabel={tCommon('back')}
      detailTitle={tCommon('legalEntityDetails')}
    >
      <ScanLoader
        layout="center"
        label={t('loading')}
        statusAriaLabel={t('loading')}
        className="min-h-40 py-20"
      />
    </PolicyDetailPageShell>
  );
}
