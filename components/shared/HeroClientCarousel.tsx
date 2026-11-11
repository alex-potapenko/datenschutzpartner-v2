'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';

const SLIDE_INTERVAL_MS = 5000;
/** Static nudge left for all hero portraits (independent of slide animation). */
const HERO_PORTRAIT_SHIFT_PX = 80;

const HERO_CAROUSEL_SLIDES = [
  { id: 'martin', photo: '/photo-home-martin.png' },
  { id: 'cornelia', photo: '/photo-home-cornelia.png' },
  { id: 'andreas', photo: '/photo-home-andreas.png' },
  { id: 'toni', photo: '/photo-home-toni.png' },
] as const;

type SlideId = (typeof HERO_CAROUSEL_SLIDES)[number]['id'];

type SlideState = 'enter' | 'center' | 'exit';

/** Enter and exit share duration and curve so the outgoing slide never lingers. */
const SWAP_DURATION = 0.7;
const SWAP_EASE = [0.65, 0, 0.35, 1] as const;
const SWAP = { duration: SWAP_DURATION, ease: SWAP_EASE };
const INSTANT = { duration: 0 };

const portraitVariants: Variants = {
  enter: { opacity: 0, x: 120, transition: INSTANT },
  center: { opacity: 1, x: 0, transition: SWAP },
  exit: { opacity: 0, x: -120, transition: SWAP },
};

const captionVariants: Variants = {
  enter: { opacity: 0, x: 200, transition: INSTANT },
  center: {
    opacity: 1,
    x: 0,
    transition: { ...SWAP, delayChildren: 0.25, staggerChildren: 0.08 },
  },
  exit: { opacity: 0, x: -200, transition: SWAP },
};

/** Quote staggers in with a small rise; name + role fade as one block (no per-line y — avoids role “jump”). */
const quoteLineVariants: Variants = {
  enter: { opacity: 0, y: 12, transition: INSTANT },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const attributionVariants: Variants = {
  enter: { opacity: 0, transition: INSTANT },
  center: { opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const reducedVariants: Variants = {
  enter: { opacity: 0, transition: INSTANT },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function slideStateFor(index: number, active: number, previous: number | null): SlideState {
  if (index === active) return 'center';
  if (index === previous) return 'exit';
  return 'enter';
}

const PORTRAIT_CLASS =
  'block w-full object-contain object-bottom [filter:drop-shadow(0_16px_40px_color-mix(in_srgb,var(--key-500)_20%,transparent))]';

const CAPTION_CLASS =
  'absolute top-[34%] right-0 z-20 w-full max-w-[260px] translate-x-[60px] translate-y-[44px] sm:top-[36%] lg:top-[38%]';

function CarouselSlideCopy({
  slideId,
  quoteClassName,
  nameClassName,
  roleClassName,
}: {
  slideId: SlideId;
  quoteClassName?: string;
  nameClassName?: string;
  roleClassName?: string;
}) {
  const t = useTranslations('landing');
  return (
    <>
      <p
        className={cn(
          'text-key-500 font-display m-0 font-medium whitespace-pre-line',
          quoteClassName
        )}
      >
        {t(`heroCarouselSlides.${slideId}.quote`)}
      </p>
      <cite className="mt-2 block font-normal not-italic">
        <small className="text-foreground text-sm leading-snug">
          <span className={cn('block', nameClassName)}>
            {t(`heroCarouselSlides.${slideId}.name`)}
          </span>
          <span className={cn('block whitespace-pre-line', roleClassName)}>
            {t(`heroCarouselSlides.${slideId}.role`)}
          </span>
        </small>
      </cite>
    </>
  );
}

function StaticCarouselSlide({ slideId, photo }: { slideId: SlideId; photo: string }) {
  const t = useTranslations('landing');
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      <div
        className="relative z-10 mx-auto w-full max-w-[480px]"
        style={{ transform: `translateX(-${HERO_PORTRAIT_SHIFT_PX}px)` }}
      >
        <img
          src={photo}
          alt={t(`heroCarouselSlides.${slideId}.portraitAlt`)}
          width={480}
          height={480}
          className={PORTRAIT_CLASS}
        />
      </div>
      <figcaption className={CAPTION_CLASS}>
        <blockquote className="m-0 text-left text-sm leading-snug">
          <CarouselSlideCopy slideId={slideId} />
        </blockquote>
      </figcaption>
    </div>
  );
}

export function HeroClientCarousel() {
  const t = useTranslations('landing');
  const reduceMotion = useReducedMotion();
  const hydrated = useHydrated();
  const slideCount = HERO_CAROUSEL_SLIDES.length;
  const [{ active, previous }, setSlides] = useState<{ active: number; previous: number | null }>({
    active: 0,
    previous: null,
  });

  useEffect(() => {
    if (!hydrated || reduceMotion) return;
    const intervalId = window.setInterval(() => {
      setSlides((current) => ({
        active: (current.active + 1) % slideCount,
        previous: current.active,
      }));
    }, SLIDE_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [hydrated, reduceMotion, slideCount]);

  const portraitMotion = reduceMotion ? reducedVariants : portraitVariants;
  const captionMotion = reduceMotion ? reducedVariants : captionVariants;
  const quoteMotion = reduceMotion ? undefined : quoteLineVariants;
  const attributionMotion = reduceMotion ? undefined : attributionVariants;

  const firstSlide = HERO_CAROUSEL_SLIDES[0];

  return (
    <figure
      className="relative m-0 flex h-full min-h-[inherit] w-full flex-col justify-end"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('heroClientCarouselAriaLabel')}
    >
      <div className="relative h-full min-h-[inherit] w-full">
        {!hydrated ? (
          <StaticCarouselSlide slideId={firstSlide.id} photo={firstSlide.photo} />
        ) : (
          HERO_CAROUSEL_SLIDES.map((slide, index) => {
            const state = slideStateFor(index, active, previous);
            const isActive = state === 'center';
            return (
              <motion.div
                key={slide.id}
                className={cn(
                  'absolute inset-0 flex flex-col justify-end',
                  isActive ? 'z-10' : 'pointer-events-none z-0'
                )}
                initial={false}
                animate={state}
                aria-hidden={!isActive}
              >
                <div
                  className="relative z-10 mx-auto w-full max-w-[480px]"
                  style={{ transform: `translateX(-${HERO_PORTRAIT_SHIFT_PX}px)` }}
                >
                  <motion.img
                    src={slide.photo}
                    alt={t(`heroCarouselSlides.${slide.id}.portraitAlt`)}
                    width={480}
                    height={480}
                    className={PORTRAIT_CLASS}
                    variants={portraitMotion}
                  />
                </div>
                <motion.figcaption className={CAPTION_CLASS} variants={captionMotion}>
                  <blockquote className="m-0 text-left text-sm leading-snug">
                    <motion.p
                      className="text-key-500 font-display m-0 font-medium whitespace-pre-line"
                      variants={quoteMotion}
                    >
                      {t(`heroCarouselSlides.${slide.id}.quote`)}
                    </motion.p>
                    <motion.cite
                      className="mt-2 block font-normal not-italic"
                      variants={attributionMotion}
                    >
                      <small className="text-foreground text-sm leading-snug">
                        <span className="block">{t(`heroCarouselSlides.${slide.id}.name`)}</span>
                        <span className="block whitespace-pre-line">
                          {t(`heroCarouselSlides.${slide.id}.role`)}
                        </span>
                      </small>
                    </motion.cite>
                  </blockquote>
                </motion.figcaption>
              </motion.div>
            );
          })
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {t('heroClientCarouselSlideStatus', { current: active + 1, total: slideCount })}
      </p>
    </figure>
  );
}
