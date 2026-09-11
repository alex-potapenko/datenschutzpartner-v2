'use client';

import Link from 'next/link';
import { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CaretLeft, SignIn, UserCircle } from '@/components/ui';
import { Button } from '@/components/ui';
import { useSession } from '@/api/auth';
import { Container } from '@/components/shared/Container';
import { HistoryBackLink } from '@/components/shared/HistoryBackLink';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Logo } from '@/components/shared/Logo';
import { topBarOutlineButtonClass } from './constants';
import { TopBarFrame } from './TopBarFrame';
import { TopBarMobileDrawer } from './TopBarMobileDrawer';
import { TopBarNav } from './TopBarNav';
import { TopBarRoot } from './TopBarRoot';
import type { TopBarBackLink } from './types';

/** Public site top bar — logo, nav, locale, auth, mobile drawer. */
export function PublicTopBar({
  activePath,
  backLink,
  showLogo = true,
}: {
  activePath?: string;
  backLink?: TopBarBackLink;
  showLogo?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email);
  const authHref = isAuthenticated ? '/account' : '/login';
  const authLabel = isAuthenticated ? t('myAccount') : t('logIn');
  const AuthIcon = isAuthenticated ? UserCircle : SignIn;

  return (
    <TopBarRoot hideOnFooterScroll>
      <Container>
        <TopBarFrame layout="public-grid">
          <div className="flex min-w-0 items-center gap-4 justify-self-start">
            {backLink ? (
              <HistoryBackLink
                fallbackHref={backLink.href}
                label={backLink.label}
                className="font-display inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-white/55 transition-colors hover:text-white"
              >
                <CaretLeft size={14} weight="bold" />
                <span className="hidden sm:inline">{backLink.label}</span>
              </HistoryBackLink>
            ) : null}
            {showLogo ? (
              <Link
                href="/"
                aria-label={tc('home')}
                className="flex min-w-0 shrink cursor-pointer items-center"
              >
                <Logo />
              </Link>
            ) : null}
          </div>

          <TopBarNav
            activePath={activePath}
            className="hidden items-center gap-5 justify-self-center lg:flex"
          />

          <div className="col-start-2 flex min-w-0 shrink-0 items-center gap-2 justify-self-end sm:gap-3 lg:col-start-3">
            <TopBarNav
              activePath={activePath}
              className="hidden min-w-0 items-center gap-5 overflow-x-auto min-[840px]:flex lg:hidden"
              pagesMode="responsive"
            />
            <div
              aria-hidden
              className="hidden h-5 w-px shrink-0 bg-white/20 min-[840px]:block lg:hidden"
            />
            <LocaleSwitcher className="hidden shrink-0 sm:inline-flex" />
            <Button
              variant="outline"
              size="md"
              className={`${topBarOutlineButtonClass} hidden gap-2 sm:inline-flex`}
              onPress={() => {
                startTransition(() => {
                  router.push(authHref);
                });
              }}
            >
              <AuthIcon size={16} weight="bold" />
              {authLabel}
            </Button>
            <TopBarMobileDrawer
              activePath={activePath}
              isAuthenticated={isAuthenticated}
              authHref={authHref}
              authLabel={authLabel}
            />
          </div>
        </TopBarFrame>
      </Container>
    </TopBarRoot>
  );
}
