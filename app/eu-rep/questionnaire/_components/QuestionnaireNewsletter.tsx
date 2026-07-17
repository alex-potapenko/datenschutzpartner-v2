'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui';

export function QuestionnaireNewsletter() {
  const t = useTranslations('newsletter');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-foreground text-base font-semibold">{t('successTitle')}</p>
        <p className="text-muted text-sm">{t('successBody')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="email"
          variant="primary"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder={t('placeholder')}
          required
          fullWidth
          className="sm:max-w-[280px]"
        />
        <Button type="submit" variant="primary" size="md" className="shrink-0 rounded-full">
          {t('subscribe')}
        </Button>
      </form>
      <p className="text-muted text-xs">
        {t('privacyPrefix')}{' '}
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          {t('privacyLink')}
        </Link>
        .
      </p>
    </div>
  );
}
