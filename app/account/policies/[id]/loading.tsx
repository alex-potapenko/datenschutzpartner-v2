import { getTranslations } from 'next-intl/server';
import { GENERATOR_POLICIES_HREF } from '@/app/account/_components/account-sections';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { Spinner } from '@/components/ui';

export default async function PolicyDetailLoading() {
  const t = await getTranslations('account');
  const tCommon = await getTranslations('common');

  return (
    <PolicyDetailPageShell
      backHref={GENERATOR_POLICIES_HREF}
      backLabel={tCommon('back')}
      detailTitle={tCommon('policyDetails')}
    >
      <div className="flex min-h-40 items-center justify-center py-20">
        <Spinner aria-label={t('loading')} />
      </div>
    </PolicyDetailPageShell>
  );
}
