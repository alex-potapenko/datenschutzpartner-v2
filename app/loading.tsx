import { getTranslations } from 'next-intl/server';
import { ScanLoader } from '@/components/shared/ScanLoader';

export default async function Loading() {
  const t = await getTranslations('common');

  return <ScanLoader layout="page" label={t('loading')} statusAriaLabel={t('loading')} />;
}
