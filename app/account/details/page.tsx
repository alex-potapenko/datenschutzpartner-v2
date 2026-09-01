import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AccountDetailsApp } from './_components/AccountDetailsApp';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.accountDetails');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default function AccountDetailsPage() {
  return <AccountDetailsApp />;
}
