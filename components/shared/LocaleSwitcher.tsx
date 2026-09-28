'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button, Globe, cn } from '@/components/ui';
import { setLocale } from '@/app/actions/locale';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

function getNextLocale(locale: Locale): Locale {
  return locales.find((code) => code !== locale) ?? defaultLocale;
}

interface LocaleSwitcherProps {
  className?: string;
  /** Bordered globe control instead of the target locale label. */
  display?: 'label' | 'icon';
  variant?: 'ghost' | 'outline';
}

export function LocaleSwitcher({
  className,
  display = 'label',
  variant = 'ghost',
}: LocaleSwitcherProps) {
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

  const ariaLabel = t('switchTo', { locale: nextLocale.toUpperCase() });

  if (display === 'icon') {
    return (
      <Button
        type="button"
        variant="outline"
        size="md"
        isIconOnly
        isDisabled={pending}
        aria-label={ariaLabel}
        onPress={switchLocale}
        className={cn('shrink-0', className)}
      >
        <Globe size={16} weight="bold" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="md"
      isDisabled={pending}
      aria-label={ariaLabel}
      onPress={switchLocale}
      className={cn(
        'font-display text-sm font-medium uppercase',
        variant === 'ghost' && 'text-white/55 hover:bg-white/10 hover:text-white',
        className
      )}
    >
      {nextLocale}
    </Button>
  );
}
