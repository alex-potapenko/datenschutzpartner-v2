'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AccountAddMenu } from '@/components/shared/AccountAddMenu';
import { AccountProfileMenu } from '@/components/shared/AccountProfileMenu';
import { AccountScopeSwitcher } from '@/components/shared/AccountScopeSwitcher';
import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { TOPBAR_ROW_PADDING } from './constants';
import { TopBarFrame } from './TopBarFrame';
import { TopBarRoot } from './TopBarRoot';

/** Member area top bar — logo column, scope switcher, account actions. */
export function AccountTopBar({ showLogo = true }: { showLogo?: boolean }) {
  const tc = useTranslations('common');

  return (
    <TopBarRoot hideOnFooterScroll={false}>
      <Container>
        <TopBarFrame layout="account">
          <div
            className={`flex shrink-0 items-center border-r border-white/20 ${TOPBAR_ROW_PADDING} lg:w-[280px]`}
          >
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
          <div
            className={`flex min-w-0 flex-1 items-center justify-between gap-3 ${TOPBAR_ROW_PADDING} sm:px-8`}
          >
            <AccountScopeSwitcher className="min-w-0" />
            <div className="flex shrink-0 items-center gap-3">
              <AccountAddMenu />
              <AccountProfileMenu />
            </div>
          </div>
        </TopBarFrame>
      </Container>
    </TopBarRoot>
  );
}
