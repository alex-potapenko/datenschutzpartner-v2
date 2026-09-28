'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, CaretLeft } from '@/components/ui';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';

type LoginRouteHeaderProps = {
  backHref: string;
  backLabel: string;
};

export function LoginRouteHeader({ backHref, backLabel }: LoginRouteHeaderProps) {
  const router = useRouter();
  const tc = useTranslations('common');

  return (
    <header className="relative flex min-h-12 w-full items-center justify-center py-3 sm:min-h-14 sm:py-4">
      <Button
        type="button"
        variant="outline"
        size="md"
        isIconOnly
        aria-label={backLabel}
        className="absolute top-1/2 left-0 shrink-0 -translate-y-1/2"
        onPress={() => {
          router.push(backHref);
        }}
      >
        <CaretLeft size={16} weight="bold" aria-hidden />
      </Button>
      <Link
        href="/"
        aria-label={tc('home')}
        className="text-accent transition-opacity hover:opacity-80"
      >
        <Logo inverse={false} />
      </Link>
      <LocaleSwitcher
        variant="outline"
        className="absolute top-1/2 right-0 shrink-0 -translate-y-1/2"
      />
    </header>
  );
}
