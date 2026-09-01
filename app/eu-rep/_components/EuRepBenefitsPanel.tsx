'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { calculateEuRepQuote, EU_REP_PLANS, type EuRepPlanId } from '@/api/checkout';
import { Crosshair, EnvelopeSimple } from '@/components/ui';
import { EuRepPlanCard, type EuRepPlan } from './EuRepPlanCard';

const INCLUDED_KEYS = [
  'establishment',
  'art27',
  'mentionPolicy',
  'mentionRecords',
  'email',
  'post',
  'newsletter',
  'podcast',
] as const;

const BENEFIT_KEYS = ['art27', 'contact', 'inquiries'] as const;

type BenefitKey = (typeof BENEFIT_KEYS)[number];

const BENEFIT_ICONS: Record<BenefitKey, ReactNode> = {
  art27: (
    <span className="font-display text-xl leading-none font-bold" aria-hidden>
      §
    </span>
  ),
  contact: <Crosshair size={24} weight="bold" aria-hidden />,
  inquiries: <EnvelopeSimple size={24} weight="fill" aria-hidden />,
};

const BENEFIT_ICON_STYLES: Record<BenefitKey, { color: string; background: string }> = {
  art27: {
    color: 'var(--feature-purple)',
    background: 'color-mix(in srgb, var(--feature-purple) 12%, transparent)',
  },
  contact: {
    color: 'var(--feature-fuchsia)',
    background: 'color-mix(in oklab, var(--feature-fuchsia) 12%, transparent)',
  },
  inquiries: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
};

function BenefitIcon({ benefitKey }: { benefitKey: BenefitKey }) {
  const { color, background } = BENEFIT_ICON_STYLES[benefitKey];

  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background, color }}
    >
      {BENEFIT_ICONS[benefitKey]}
    </div>
  );
}

type EuRepBenefitsPanelProps = {
  /** Wizard: add one EU Rep contract for the policy being generated. */
  onChoose?: () => void;
  chooseLabel?: string;
  showBottomBorder?: boolean;
  /** Wizard add-on copy for a single policy. */
  wizardMode?: boolean;
  /** After checkout, back navigation returns here (embedded account landing). */
  checkoutReturnTo?: string;
};

export function EuRepBenefitsPanel({
  onChoose,
  chooseLabel,
  showBottomBorder = true,
  wizardMode = false,
  checkoutReturnTo,
}: EuRepBenefitsPanelProps) {
  const t = useTranslations('euRepPage');
  const tb = useTranslations('euRepPage.benefitsSection');
  const tp = useTranslations('euRepPage.pricingSection');
  const router = useRouter();
  const quote = useMemo(() => calculateEuRepQuote('basis'), []);

  const plans: EuRepPlan[] = wizardMode
    ? [
        {
          id: 'basis',
          tabLabel: t('plans.basis.name'),
          showPerYear: true,
          price: quote.amountDue.toFixed(2),
          note: t('plans.basis.requests'),
        },
      ]
    : EU_REP_PLANS.map((plan) => {
        const priced = calculateEuRepQuote(plan.id);
        return {
          id: plan.id,
          tabLabel: t(`plans.${plan.id}.name`),
          showPerYear: true,
          price: priced.amountDue.toFixed(2),
          note: t(`plans.${plan.id}.requests`),
        };
      });

  const defaultPlanId: EuRepPlanId = 'basis';

  return (
    <section id={onChoose ? undefined : 'plans'} className={onChoose ? undefined : 'scroll-mt-24'}>
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div id="what-you-get" className="flex h-full scroll-mt-24 flex-col">
          <div className="flex flex-col gap-3 p-4 sm:p-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl lg:text-3xl">
              {tb('title')}
            </h2>
          </div>

          <div className="flex max-w-xl flex-col gap-8 px-4 pb-10 sm:gap-10 sm:px-8 sm:pb-12">
            <p className="text-foreground text-base leading-relaxed">{tb('subtitle')}</p>

            <ul className="flex flex-col gap-8">
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex gap-4">
                  <BenefitIcon benefitKey={key} />
                  <div className="flex flex-col gap-1 pt-0.5">
                    <p className="text-foreground text-base font-semibold">
                      {tb(`items.${key}.title`)}
                    </p>
                    <p className="text-muted text-base leading-relaxed">
                      {tb(`items.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <EuRepPlanCard
          plans={plans}
          defaultPlanId={defaultPlanId}
          value={wizardMode ? 'basis' : undefined}
          pricePeriod={t('pricePeriod')}
          orderCta={chooseLabel ?? t('orderCta')}
          onChoose={(planId) => {
            if (onChoose) {
              onChoose();
              return;
            }
            const params = new URLSearchParams();
            if (planId && planId !== 'basis') {
              params.set('plan', planId);
            }
            if (checkoutReturnTo) {
              params.set('returnTo', checkoutReturnTo);
            }
            const query = params.toString();
            router.push(`/account/eu-rep/checkout${query ? `?${query}` : ''}`);
          }}
          tabsAriaLabel={tp('entityCountLabel')}
          selectPlanTitle={wizardMode ? tp('selectOne') : tp('selectPlan')}
          includedTitle={tp('includedTitle')}
          features={INCLUDED_KEYS.map((key) => t(`features.${key}`))}
          legal={t.rich('legal', {
            terms: (chunks) => <Link href="/terms">{chunks}</Link>,
          })}
        />
      </div>

      {showBottomBorder ? (
        <div
          aria-hidden
          className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
        />
      ) : null}
    </section>
  );
}
