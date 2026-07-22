import { getTranslations } from 'next-intl/server';
import { RegularPage } from '@/components/shared/RegularPage';
import { Spinner } from '@/components/ui';

export default async function PolicyDetailLoading() {
  const t = await getTranslations('account');
  const tDocuments = await getTranslations('account.documents');

  return (
    <RegularPage
      showFooter={false}
      noPadding
      minimal
      backLink={{
        href: '/account?section=generator',
        label: tDocuments('backToList'),
        preferHref: true,
      }}
    >
      <div className="flex min-h-40 items-center justify-center py-20">
        <Spinner aria-label={t('loading')} />
      </div>
    </RegularPage>
  );
}
