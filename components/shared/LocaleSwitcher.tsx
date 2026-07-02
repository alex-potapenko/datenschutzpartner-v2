'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button, cn } from '@/components/ui';
import { setLocale } from '@/app/actions/locale';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

function getNextLocale(locale: Locale): Locale {
  return locales.find((code) => code !== locale) ?? defaultLocale;
}

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const nextLocale = getNextLocale(locale);
  const router = useRouter();
  const t = useTranslations('common');
  const [pending, startTransition] = useTransition();

  function switchLocale() {
    startTransition(async () => {
      await setLocale(nextLocale);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      isDisabled={pending}
      aria-label={t('switchTo', { locale: nextLocale.toUpperCase() })}
      onPress={switchLocale}
      className={cn(
        'font-display text-sm font-medium text-white/75 uppercase hover:bg-white/10 hover:text-white',
        className
      )}
    >
      {nextLocale}
    </Button>
  );
}
