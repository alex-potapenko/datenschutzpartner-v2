'use client';

import Link from 'next/link';
import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  FileText,
  GlobeHemisphereEast,
  GraduationCap,
  List,
  SignIn,
  UserCircle,
  X,
} from '@/components/ui';
import { useSession } from '@/api/auth';
import {
  Button,
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerBody,
  useOverlayState,
} from '@/components/ui';
import { Container } from './Container';
import { HistoryBackLink } from './HistoryBackLink';
import { Logo } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';

const SERVICE_IDS = [
  { id: '/scan', key: 'privacyGenerator', icon: <FileText size={20} weight="fill" /> },
  { id: '/eu-rep', key: 'euRep', icon: <GlobeHemisphereEast size={20} weight="fill" /> },
  { id: '/academy', key: 'academy', icon: <GraduationCap size={20} weight="fill" /> },
] as const;

const NAV_LINKS = [
  { key: 'insights', href: '/insights' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
] as const;

const navTriggerClass =
  'font-display flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-medium outline-none';

const barOutlineButtonClass = 'inline-flex shrink-0 border-white/20 text-white hover:bg-white/10';

const drawerMenuItemClass = 'rounded-xl px-4 transition-colors';

function ServicesDropdown() {
  const t = useTranslations('nav');
  const ts = useTranslations('services');

  return (
    <DropdownRoot>
      <DropdownTrigger className={`${navTriggerClass} text-white/75 hover:text-white`}>
        {t('services')}
        <CaretDown size={14} />
      </DropdownTrigger>
      <DropdownPopover placement="bottom start" className="mt-1 w-72">
        <DropdownMenu>
          {SERVICE_IDS.map(({ id, key, icon }) => (
            <DropdownItem
              key={id}
              id={id}
              href={id}
              textValue={ts(`${key}.label`)}
              className="px-4 py-3.5"
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(47,84,134,0.08)', color: 'var(--accent)' }}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">{ts(`${key}.label`)}</p>
                  <p className="text-muted mt-0.5 text-xs">{ts(`${key}.description`)}</p>
                </div>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  );
}

function NavPageLinks({
  activePath,
  linkClassName,
}: {
  activePath?: string;
  linkClassName?: string;
}) {
  const t = useTranslations('nav');

  return NAV_LINKS.map(({ key, href }) => {
    const isActive = activePath === href;
    return (
      <Link
        key={key}
        href={href}
        className={[
          'font-display text-sm font-medium whitespace-nowrap transition-colors',
          isActive ? 'text-white' : 'text-white/75 hover:text-white',
          linkClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t(key)}
      </Link>
    );
  });
}

function NavPagesDropdown({ activePath, className }: { activePath?: string; className?: string }) {
  const t = useTranslations('nav');
  const isActive = NAV_LINKS.some(({ href }) => activePath === href);

  return (
    <div className={className}>
      <DropdownRoot>
        <DropdownTrigger
          className={[
            navTriggerClass,
            isActive ? 'text-white' : 'text-white/75 hover:text-white',
          ].join(' ')}
        >
          {t('company')}
          <CaretDown size={14} />
        </DropdownTrigger>
        <DropdownPopover placement="bottom start" className="mt-1 min-w-44">
          <DropdownMenu>
            {NAV_LINKS.map(({ key, href }) => (
              <DropdownItem
                key={href}
                id={href}
                href={href}
                textValue={t(key)}
                className="font-display px-4 py-2.5 text-sm"
              >
                {t(key)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </DropdownPopover>
      </DropdownRoot>
    </div>
  );
}

function TopBarNav({
  activePath,
  className,
  pagesMode = 'links',
}: {
  activePath?: string;
  className?: string;
  pagesMode?: 'links' | 'responsive';
}) {
  return (
    <nav className={className}>
      <ServicesDropdown />

      {pagesMode === 'links' ? (
        <NavPageLinks activePath={activePath} />
      ) : (
        <>
          <NavPageLinks activePath={activePath} linkClassName="hidden min-[960px]:inline" />
          <NavPagesDropdown activePath={activePath} className="min-[960px]:hidden" />
        </>
      )}
    </nav>
  );
}

interface TopBarProps {
  activePath?: string;
  /** Fallback destination when there is no browser history (e.g. direct entry). */
  backLink?: { href: string; label: string; preferHref?: boolean };
  showLogo?: boolean;
  /** When true, only the back link is shown — no logo, nav, locale switcher, or actions. */
  minimal?: boolean;
  /** Account area: wordmark reads "My Account", no site nav or auth button. */
  variant?: 'default' | 'account';
}

export function TopBar({
  activePath,
  backLink,
  showLogo = true,
  minimal = false,
  variant = 'default',
}: TopBarProps) {
  const router = useRouter();
  const t = useTranslations('nav');
  const ts = useTranslations('services');
  const tc = useTranslations('common');
  const session = useSession();
  const isAuthenticated = Boolean(session.data?.email);
  const isAccount = variant === 'account';
  const authHref = isAuthenticated ? '/account' : '/login';
  const authLabel = isAuthenticated ? t('myAccount') : t('logIn');
  const AuthIcon = isAuthenticated ? UserCircle : SignIn;
  const [hidden, setHidden] = useState(false);
  const mobileMenu = useOverlayState();

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    let footerVisible = false;

    const updateHidden = () => {
      setHidden(footerVisible && window.scrollY > 0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        footerVisible = entry?.isIntersecting ?? false;
        updateHidden();
      },
      {
        threshold: 0,
      }
    );

    observer.observe(footer);
    window.addEventListener('scroll', updateHidden, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateHidden);
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50 text-white transition-transform duration-300"
      style={{
        backgroundColor: 'var(--accent)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <Container>
        {minimal ? (
          <div className="flex items-center border-r border-l border-white/20 px-4 py-5 sm:px-8 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" aria-label={tc('home')} className="flex min-w-0 shrink items-center">
                <Logo showText={false} />
              </Link>
              {backLink ? (
                <Button
                  variant="outline"
                  size="md"
                  className={`${barOutlineButtonClass} gap-2`}
                  aria-label={backLink.label}
                  onPress={() => {
                    if (!backLink.preferHref && window.history.length > 1) {
                      router.back();
                      return;
                    }

                    router.push(backLink.href);
                  }}
                >
                  <CaretLeft size={16} weight="bold" />
                  {backLink.label}
                </Button>
              ) : null}
            </div>
          </div>
        ) : isAccount ? (
          <div className="flex items-stretch border-r border-l border-white/20">
            <div className="flex shrink-0 items-center border-r border-white/20 px-4 py-5 sm:px-8 lg:w-[280px]">
              {showLogo ? (
                <Link href="/" aria-label={tc('home')} className="flex min-w-0 shrink items-center">
                  <Logo />
                </Link>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-5 sm:px-8">
              <span className="font-display text-sm font-medium tracking-tight text-white lowercase">
                {t('myAccount')}
              </span>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <LocaleSwitcher className="shrink-0" />
                <Button
                  variant="outline"
                  size="md"
                  className={`${barOutlineButtonClass} gap-2`}
                  aria-label={tc('close')}
                  onPress={() => {
                    if (window.history.length > 1) {
                      router.back();
                      return;
                    }

                    router.push('/');
                  }}
                >
                  <X size={16} weight="bold" />
                  {tc('close')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-center border-r border-l border-white/20 px-4 py-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
            <div className="flex min-w-0 items-center gap-4 justify-self-start">
              {backLink && (
                <HistoryBackLink
                  fallbackHref={backLink.href}
                  label={backLink.label}
                  className="font-display inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-white/75 transition-colors hover:text-white"
                >
                  <CaretLeft size={14} weight="bold" />
                  <span className="hidden sm:inline">{backLink.label}</span>
                </HistoryBackLink>
              )}
              {showLogo && (
                <Link href="/" aria-label={tc('home')} className="flex min-w-0 shrink items-center">
                  <Logo />
                </Link>
              )}
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
                className={`${barOutlineButtonClass} hidden gap-2 sm:inline-flex`}
                onPress={() => {
                  startTransition(() => {
                    router.push(authHref);
                  });
                }}
              >
                <AuthIcon size={16} weight="bold" />
                {authLabel}
              </Button>
              <Button
                variant="outline"
                size="md"
                isIconOnly
                aria-label={tc('menu')}
                className={`${barOutlineButtonClass} hidden max-[479px]:inline-flex min-[840px]:hidden lg:hidden`}
                onPress={() => {
                  mobileMenu.open();
                }}
              >
                <List size={16} weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="md"
                className={`${barOutlineButtonClass} hidden gap-2 min-[480px]:inline-flex min-[840px]:hidden lg:hidden`}
                onPress={() => {
                  mobileMenu.open();
                }}
              >
                <List size={16} weight="bold" />
                {tc('menu')}
              </Button>
            </div>
          </div>
        )}
      </Container>

      {!minimal && !isAccount ? (
        <DrawerRoot state={mobileMenu}>
          <DrawerBackdrop isDismissable>
            <DrawerContent placement="right" className="max-[839px]:!justify-stretch">
              <DrawerDialog className="bg-background text-foreground flex h-full flex-col gap-0 overflow-hidden p-0 shadow-none max-[839px]:w-full max-[839px]:max-w-full">
                <DrawerHeader
                  className="shrink-0 gap-0 border-0 p-0 text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Container>
                    <div className="grid grid-cols-[1fr_auto] items-center border-r border-l border-white/20 px-4 py-5 sm:px-8">
                      <Link
                        href="/"
                        aria-label={tc('home')}
                        className="flex min-w-0 shrink items-center"
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
                          className={barOutlineButtonClass}
                          onPress={() => {
                            mobileMenu.close();
                          }}
                        >
                          <X size={16} weight="bold" />
                        </Button>
                      </div>
                    </div>
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
                        {SERVICE_IDS.map(({ id, key, icon }) => (
                          <Link
                            key={id}
                            href={id}
                            onClick={() => {
                              mobileMenu.close();
                            }}
                            className={`hover:bg-surface flex items-center justify-between gap-3 ${drawerMenuItemClass}`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                                style={{
                                  background: 'rgba(47,84,134,0.08)',
                                  color: 'var(--accent)',
                                }}
                              >
                                {icon}
                              </div>
                              <div>
                                <p className="text-foreground text-sm font-semibold">
                                  {ts(`${key}.label`)}
                                </p>
                                <p className="text-muted mt-0.5 text-xs">
                                  {ts(`${key}.description`)}
                                </p>
                              </div>
                            </div>
                            <CaretRight size={14} className="shrink-0" />
                          </Link>
                        ))}
                      </div>

                      <div className="border-border flex flex-col border-t">
                        {NAV_LINKS.map(({ key, href }) => {
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
      ) : null}
    </header>
  );
}
