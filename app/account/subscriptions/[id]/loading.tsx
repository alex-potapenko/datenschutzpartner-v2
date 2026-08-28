import { getTranslations } from 'next-intl/server';
import { PolicyDetailPageShell } from '@/components/shared/PolicyDetailLayout';
import { Spinner } from '@/components/ui';

export default async function SubscriptionDetailLoading() {
  const t = await getTranslations('account');
  const tCommon = await getTranslations('common');

  return (
    <PolicyDetailPageShell
      backHref="/account"
      backLabel={tCommon('back')}
      detailTitle={tCommon('subscriptionDetails')}
    >
      <div className="flex min-h-40 items-center justify-center py-20">
        <Spinner aria-label={t('loading')} />
      </div>
    </PolicyDetailPageShell>
  );
}
