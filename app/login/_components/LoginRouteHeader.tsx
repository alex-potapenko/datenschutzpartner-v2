'use client';

import { NavigationLink } from '@/components/shared/NavigationLink';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';

type LoginRouteHeaderProps = {
  backHref: string;
  backLabel: string;
};

export function LoginRouteHeader({ backHref, backLabel }: LoginRouteHeaderProps) {
  return (
    <header className="relative flex min-h-10 items-center gap-4 pt-4 sm:pt-5">
      <NavigationLink href={backHref} chevron="left" className="shrink-0">
        {backLabel}
      </NavigationLink>
      <LocaleSwitcher className="text-accent hover:bg-key-50 hover:text-foreground ml-auto shrink-0 uppercase" />
    </header>
  );
}
