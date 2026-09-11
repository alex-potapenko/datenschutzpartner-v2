'use client';

import { useTranslations } from 'next-intl';
import { EnvelopeSimple } from '@/components/ui';
import { cn } from '@/lib/utils';

export type NewsletterConfirmationNoticeProps = {
  className?: string;
};

export function NewsletterConfirmationNotice({ className }: NewsletterConfirmationNoticeProps) {
  const t = useTranslations('newsletterConfirmation');

  return (
    <section
      className={cn(
        'rounded-2xl bg-[color-mix(in_srgb,var(--feature-teal)_12%,transparent)] px-5 py-4 sm:px-6',
        className
      )}
    >
      <p className="font-display mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--feature-teal)]">
        <EnvelopeSimple size={16} weight="fill" className="shrink-0" aria-hidden />
        <span>{t('title')}</span>
      </p>
      <p className="text-foreground text-sm leading-relaxed">{t('doubleOptIn')}</p>
    </section>
  );
}
