import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AcademyPastSessionsPanel } from '@/app/academy/_components/AcademyPastSessionsPanel';
import { RegularPage } from '@/components/shared/RegularPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('academy.pastSessions');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function AcademyPastSessionsPage() {
  const tPage = await getTranslations('academy.pastSessions');

  return (
    <RegularPage
      activePath="/academy"
      backLink={{ href: '/academy', label: tPage('backToAcademy') }}
      showLogo={false}
      noPadding
    >
      <AcademyPastSessionsPanel />
    </RegularPage>
  );
}
