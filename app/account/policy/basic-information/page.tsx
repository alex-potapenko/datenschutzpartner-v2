import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PolicyBasicInformationApp } from './_components/PolicyBasicInformationApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.policyUpdates.basic');

  return {
    title: t('screenTitle'),
    robots: { index: false, follow: false },
  };
}

export default function PolicyBasicInformationPage() {
  return <PolicyBasicInformationApp />;
}
