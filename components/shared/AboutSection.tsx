import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CaretRight } from '@/components/ui';
import { Container } from './Container';

export async function AboutSection() {
  const t = await getTranslations('aboutSection');

  return (
    <section className="border-border bg-background border-b">
      <Container>
        <div className="border-border relative flex flex-col items-start gap-8 border-r border-l p-4 pt-16 sm:p-8 sm:pt-24 lg:flex-row lg:gap-24 lg:pt-36">
          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-1/3">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {t('title')}
            </h2>
            <p className="text-foreground text-base leading-relaxed">{t('body')}</p>
            <div>
              <Link
                href="/about"
                className="inline-flex shrink-0 items-center gap-1 text-base font-normal transition-colors hover:text-[var(--link-hover)]"
                style={{ color: 'var(--accent)' }}
              >
                {t('learnMore')} <CaretRight size={16} />
              </Link>
            </div>
          </div>

          <div className="squircle aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:flex-1 lg:self-stretch">
            <img
              src="/team.webp"
              alt={t('imageAlt')}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
