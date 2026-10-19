'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSimulateAffiliateApprovalEmail } from '@/api/affiliate';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { env } from '@/env';
import { CheckCircle } from '@/components/ui';

const SUCCESS_ICON_SURFACE = 'color-mix(in srgb, var(--accent) 8%, transparent)';

export function AffiliateApplicationStatusCard() {
  const t = useTranslations('account.affiliate');
  const tc = useTranslations('common');
  const simulateApprovalEmail = useSimulateAffiliateApprovalEmail();

  const isPrototypeMock = env.NEXT_PUBLIC_API_MOCKING === 'enabled';

  return (
    <div
      className="flex w-full flex-col items-center gap-4 text-center"
      role="status"
      aria-labelledby="affiliate-pending-card-title"
    >
      <div
        className="squircle flex size-12 shrink-0 items-center justify-center"
        style={{ background: SUCCESS_ICON_SURFACE }}
      >
        <CheckCircle size={24} weight="fill" style={{ color: 'var(--accent)' }} aria-hidden />
      </div>

      <h3 id="affiliate-pending-card-title" className="text-foreground text-base font-semibold">
        {t('application.successTitle')}
      </h3>
      <p className="text-foreground text-sm leading-relaxed">{t('status.pending')}</p>

      {isPrototypeMock ? (
        <NavigationLink
          size="sm"
          chevron="right"
          className="justify-center"
          onPress={() => {
            if (simulateApprovalEmail.isPending) return;
            void simulateApprovalEmail.mutateAsync().catch(() => {
              toast.error(tc('error'));
            });
          }}
        >
          {t('pendingCard.prototypeSimulateEmailLink')}
        </NavigationLink>
      ) : null}
    </div>
  );
}
