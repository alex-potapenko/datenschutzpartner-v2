import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '../_components/ForgotPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forgotPassword');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function ForgotPasswordPage() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
