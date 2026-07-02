import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function EuRepHero() {
  const t = await getTranslations('euRepPage');

  return (
    <section className="border-border bg-background border-b">
      <div className="border-border grid items-stretch lg:grid-cols-2">
        <div className="border-border flex flex-col lg:border-r">
          <div className="flex flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
            <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
              {t('title')}
            </h1>
            <p className="text-foreground max-w-md text-base leading-relaxed sm:text-lg">
              {t.rich('heroSubtitle', {
                questionnaire: (chunks) => <Link href="/scan">{chunks}</Link>,
              })}
            </p>
          </div>
        </div>

        <div
          role="img"
          aria-label={t('heroPanelTitle')}
          className="relative aspect-[2/1] w-full bg-cover bg-center lg:aspect-auto lg:min-h-[320px]"
          style={{ backgroundImage: "url('/eu-rep.jpeg')" }}
        />
      </div>
    </section>
  );
}
