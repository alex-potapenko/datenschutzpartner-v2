import { Spinner } from '@/components/ui';
import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('common');

  return (
    <div className="flex grow items-center justify-center py-24">
      <Spinner aria-label={t('loading')} />
    </div>
  );
}
