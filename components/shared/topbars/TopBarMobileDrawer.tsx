'use client';

import Link from 'next/link';
import { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CaretRight, List, SignIn, UserCircle, X } from '@/components/ui';
import {
  Button,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerRoot,
  useOverlayState,
} from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Logo } from '@/components/shared/Logo';
import { topBarDrawerMenuItemClass, topBarOutlineButtonClass } from './constants';
import { TopBarFrame } from './TopBarFrame';
import { SERVICE_IDS, ServiceItemContent, TOPBAR_NAV_LINKS } from './TopBarNav';

export function TopBarMobileDrawer({
  activePath,
  isAuthenticated,
  authHref,
  authLabel,
}: {
  activePath?: string;
  isAuthenticated: boolean;
  authHref: string;
  authLabel: string;
}) {
  const router = useRouter();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const mobileMenu = useOverlayState();
  const AuthIcon = isAuthenticated ? UserCircle : SignIn;

  return (
    <>
      <Button
        variant="outline"
        size="md"
        isIconOnly
        aria-label={tc('menu')}
        className={`${topBarOutlineButtonClass} hidden max-[479px]:inline-flex min-[840px]:hidden lg:hidden`}
        onPress={() => {
          mobileMenu.open();
        }}
      >
        <List size={16} weight="bold" />
      </Button>
      <Button
        variant="outline"
        size="md"
        className={`${topBarOutlineButtonClass} hidden gap-2 min-[480px]:inline-flex min-[840px]:hidden lg:hidden`}
        onPress={() => {
          mobileMenu.open();
        }}
      >
        <List size={16} weight="bold" />
        {tc('menu')}
      </Button>

      <DrawerRoot state={mobileMenu}>
        <DrawerBackdrop isDismissable>
          <DrawerContent placement="right" className="max-[839px]:!justify-stretch">
            <DrawerDialog className="bg-background text-foreground flex h-full flex-col gap-0 overflow-hidden p-0 shadow-none max-[839px]:w-full max-[839px]:max-w-full">
              <DrawerHeader
                className="shrink-0 gap-0 border-0 p-0 text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Container>
                  <TopBarFrame layout="drawer-header">
                    <Link
                      href="/"
                      aria-label={tc('home')}
                      className="flex min-w-0 shrink cursor-pointer items-center"
                      onClick={() => {
                        mobileMenu.close();
                      }}
                    >
                      <Logo />
                    </Link>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="md"
                        isIconOnly
                        aria-label={tc('close')}
                        className={topBarOutlineButtonClass}
                        onPress={() => {
                          mobileMenu.close();
                        }}
                      >
                        <X size={16} weight="bold" />
                      </Button>
                    </div>
                  </TopBarFrame>
                </Container>
                <div aria-hidden className="h-px w-full bg-white/20" />
              </DrawerHeader>

              <DrawerBody className="bg-background !m-0 !mt-0 flex min-h-0 flex-1 flex-col !p-0">
                <Container className="flex min-h-0 flex-1 flex-col">
                  <div className="border-border flex min-h-0 flex-1 flex-col overflow-y-auto border-r border-l">
                    <div className="flex flex-col gap-4 py-4">
                      <p className="font-display text-foreground px-4 text-sm font-medium">
                        {t('services')}
                      </p>
                      {SERVICE_IDS.map(({ id, key, icon, accent, comingSoon }) => (
                        <Link
                          key={id}
                          href={id}
                          onClick={() => {
                            mobileMenu.close();
                          }}
                          className={`hover:bg-surface flex items-center justify-between gap-3 ${topBarDrawerMenuItemClass}`}
                        >
                          <ServiceItemContent
                            serviceKey={key}
                            icon={icon}
                            accent={accent}
                            comingSoon={comingSoon}
                            showCaret
                          />
                        </Link>
                      ))}
                    </div>

                    <div className="border-border flex flex-col border-t">
                      {TOPBAR_NAV_LINKS.map(({ key, href }) => {
                        const isActive = activePath === href;
                        return (
                          <Link
                            key={key}
                            href={href}
                            onClick={() => {
                              mobileMenu.close();
                            }}
                            className={[
                              'font-display border-border flex items-center justify-between border-b p-4 text-sm font-medium transition-colors',
                              isActive ? 'text-foreground' : 'text-accent hover:bg-surface',
                            ].join(' ')}
                          >
                            <span>{t(key)}</span>
                            <CaretRight size={14} className="shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </Container>

                <div aria-hidden className="bg-border h-px w-full shrink-0" />

                <Container className="shrink-0">
                  <div className="border-border flex items-center justify-between gap-2 border-r border-l px-4 py-5 sm:gap-3 sm:px-8">
                    <LocaleSwitcher className="text-foreground/75 hover:bg-surface hover:text-foreground shrink-0" />
                    <Button
                      variant="outline"
                      size="md"
                      className="gap-2"
                      onPress={() => {
                        mobileMenu.close();
                        startTransition(() => {
                          router.push(authHref);
                        });
                      }}
                    >
                      <AuthIcon size={16} weight="bold" />
                      {authLabel}
                    </Button>
                  </div>
                </Container>
              </DrawerBody>
            </DrawerDialog>
          </DrawerContent>
        </DrawerBackdrop>
      </DrawerRoot>
    </>
  );
}
