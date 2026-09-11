'use client';

import { useTranslations } from 'next-intl';
import { Check } from '@/components/ui';
import { Container } from '@/components/shared/Container';

export type EuRepCheckoutStepId = 'entity' | 'account';

type EuRepCheckoutStepBarProps = {
  currentStepId: EuRepCheckoutStepId;
};

export function EuRepCheckoutStepBar({ currentStepId }: EuRepCheckoutStepBarProps) {
  const t = useTranslations('account.euRepCheckout.steps');

  const steps: { id: EuRepCheckoutStepId; label: string }[] = [
    { id: 'entity', label: t('entity') },
    { id: 'account', label: t('account') },
  ];

  const current = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="shrink-0" style={{ background: 'var(--accent)' }}>
      <Container>
        <div
          className="flex items-stretch overflow-hidden border-r border-l"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;

            return (
              <div
                key={step.id}
                className="flex flex-1 items-center justify-center gap-3 overflow-hidden border-r px-2 py-4 last:border-r-0 sm:justify-start sm:px-8 sm:py-6"
                style={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderTop: active || done ? '3px solid white' : '3px solid transparent',
                }}
              >
                {done ? (
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white"
                    aria-hidden
                  >
                    <Check size={14} weight="bold" style={{ color: 'var(--accent)' }} />
                  </div>
                ) : (
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: active ? 'white' : 'transparent',
                      border: active ? 'none' : '1.5px solid rgba(255,255,255,0.35)',
                      color: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
                    }}
                    aria-hidden
                  >
                    {index + 1}
                  </div>
                )}
                <span
                  className="hidden text-base font-medium whitespace-nowrap sm:inline"
                  style={{ color: done || active ? 'white' : 'rgba(255,255,255,0.35)' }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
