import { getTranslations } from 'next-intl/server';
import { GENERATOR_POLICIES_HREF } from '@/app/account/_components/account-sections';
import { RegularPage } from '@/components/shared/RegularPage';
import { Spinner } from '@/components/ui';

export default async function PolicyDetailLoading() {
  const t = await getTranslations('account');
  const tCommon = await getTranslations('common');

  return (
    <RegularPage
      showFooter={false}
      noPadding
      minimal
      backLink={{
        href: GENERATOR_POLICIES_HREF,
        label: tCommon('back'),
        preferHref: true,
      }}
    >
      <div className="flex min-h-40 items-center justify-center py-20">
        <Spinner aria-label={t('loading')} />
      </div>
    </RegularPage>
  );
}
