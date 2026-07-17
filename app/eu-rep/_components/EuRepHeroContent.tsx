'use client';

import { useTranslations } from 'next-intl';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { EuRepQuestionnaireCta } from './EuRepQuestionnaireCta';

const ARTICLE_27_URL = 'https://steigerlegal.ch/dsgvo/dsgvo-27/';

type EuRepHeroContentProps = {
  showImage?: boolean;
  showQuestionnaireCta?: boolean;
  questionnaireReturnTo?: string;
};

export function EuRepHeroContent({
  showImage = true,
  showQuestionnaireCta = true,
  questionnaireReturnTo,
}: EuRepHeroContentProps) {
  const t = useTranslations('euRepPage');

  return (
    <div
      className={
        showImage ? 'border-border grid items-stretch lg:grid-cols-2' : 'border-border w-full'
      }
    >
      <div
        className={
          showImage
            ? 'border-border order-2 flex w-full min-w-0 flex-col border-t lg:order-1 lg:border-t-0 lg:border-r'
            : 'flex w-full min-w-0 flex-col'
        }
      >
        <div className="flex w-full flex-col gap-6 px-4 pt-12 pb-12 sm:gap-10 sm:px-8 sm:pt-20 sm:pb-20">
          <h1 className="text-foreground text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
            {t('title')}
          </h1>
          <div className="text-foreground flex w-full flex-col gap-4 text-base leading-relaxed sm:text-lg">
            <p>
              {t.rich('heroIntro', {
                article27: (chunks) => (
                  <NavigationLink href={ARTICLE_27_URL} chevron="none">
                    {chunks}
                  </NavigationLink>
                ),
              })}
            </p>
            <p>{t('heroQuestionnaireLead')}</p>
          </div>
          {showQuestionnaireCta ? (
            <EuRepQuestionnaireCta label={t('questionnaireCta')} returnTo={questionnaireReturnTo} />
          ) : null}
        </div>
      </div>

      {showImage ? (
        <div
          role="img"
          aria-label={t('heroPanelTitle')}
          className="relative order-1 aspect-[2/1] w-full bg-cover bg-center lg:order-2 lg:aspect-auto lg:min-h-[320px]"
          style={{ backgroundImage: "url('/eu-rep.jpeg')" }}
        />
      ) : null}
    </div>
  );
}
