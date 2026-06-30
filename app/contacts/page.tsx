import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContactsScreen } from './_components/ContactsScreen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contacts');
  return { title: t('title') };
}

export default function ContactsPage() {
  return <ContactsScreen />;
}
