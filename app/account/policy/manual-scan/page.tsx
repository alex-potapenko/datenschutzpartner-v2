import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PolicyManualScanApp } from './_components/PolicyManualScanApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.policyUpdates.manual');

  return {
    title: t('screenTitle'),
    robots: { index: false, follow: false },
  };
}

export default function PolicyManualScanPage() {
  return <PolicyManualScanApp />;
}
