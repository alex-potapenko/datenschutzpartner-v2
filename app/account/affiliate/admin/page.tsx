import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AffiliateAdminApp } from '../_components/AffiliateAdminApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.affiliateAdmin');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default function AccountAffiliateAdminPage() {
  return <AffiliateAdminApp />;
}
