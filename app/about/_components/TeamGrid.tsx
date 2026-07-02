'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

const TEAM = [
  {
    name: 'Cornelia Diethelm',
    photo: '/photo-cornelia.jpg',
    bioKey: 'corneliaBio',
    links: {
      cdr: 'https://digitalresponsibility.ch',
    },
  },
  {
    name: 'Andreas Von Gunten',
    photo: '/photo-andreas.jpg',
    bioKey: 'andreasBio',
    links: {
      smartkmu: 'https://smartkmu.ch',
    },
  },
  {
    name: 'Marc-Antonio Messmer',
    photo: '/photo-marc-antonio.jpg',
    bioKey: 'marcBio',
    links: {},
  },
  {
    name: 'Martin Steiger',
    photo: '/photo-martin.jpg',
    bioKey: 'martinBio',
    links: {
      steiger: 'https://steigerlegal.ch',
    },
  },
] as const;

function TeamMemberCard({
  name,
  photo,
  bioKey,
  links,
  index,
}: (typeof TEAM)[number] & { index: number }) {
  const t = useTranslations('about');
  const isLast = index === TEAM.length - 1;
  const isLeftColumn = index % 2 === 0;
  const isBottomRow = index >= 2;

  const linkComponents = Object.fromEntries(
    Object.entries(links).map(([key, href]) => [
      key,
      (chunks: ReactNode) => (
        <Link key={key} href={href}>
          {chunks}
        </Link>
      ),
    ])
  );

  return (
    <article
      className={[
        'border-border flex gap-4 px-4 py-6 sm:gap-8 sm:px-8 sm:py-8',
        !isLast && 'border-b sm:border-b-0',
        isBottomRow && 'sm:border-t',
        isLeftColumn && 'sm:border-r',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative size-24 shrink-0 overflow-hidden sm:size-40">
        <img src={photo} alt={name} className="size-full object-cover object-top" />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="text-foreground text-base font-semibold">{name}</h3>
        <p className="text-foreground text-sm leading-relaxed">{t.rich(bioKey, linkComponents)}</p>
      </div>
    </article>
  );
}

export function TeamGrid() {
  const t = useTranslations('about');

  return (
    <section aria-label={t('teamAriaLabel')} className="bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {TEAM.map((member, index) => (
          <TeamMemberCard key={member.name} index={index} {...member} />
        ))}
      </div>
      <div
        aria-hidden
        className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
      />
    </section>
  );
}
