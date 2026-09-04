'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { countActivePolicySites, useSubscriptions } from '@/api/billing';
import { useSession } from '@/api/auth';
import type { GeneratedDocument } from '@/api/documents';
import { resolveDocumentSite } from '@/api/documents';
import { useStartPolicyTrial } from '@/api/checkout';
import {
  Button,
  CaretRight,
  CheckCircle,
  EnvelopeSimple,
  FileText,
  FlagBanner,
  Spinner,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { TrialPeriodNotice } from '@/components/shared/TrialPeriodNotice';
import { formatCheckoutChf } from '@/components/shared/ServiceCheckoutPlanCard';
import { privacyPolicyAccountHref } from '@/lib/account-routes';
import { calculateActivationOrderPricing } from '../activation-order-pricing';
import { buildTrialCheckoutPayload } from '../trial-payload';
import { clearWizardState, isBuyingEuRep, type EuRepState } from '../wizard-state';
import type { QuestionnaireFormData } from '../content/questionnaire-form';

type AccountActivationScreenProps = {
  domain: string;
  euRep: EuRepState;
  fillSubscriptionId?: string;
} & (
  | {
      variant: 'activation';
      email: string;
    }
  | {
      variant: 'policyReady';
      formData?: QuestionnaireFormData;
      document?: GeneratedDocument;
    }
);

function ServiceRow({
  icon,
  accent,
  title,
  detail,
  price,
  pricePeriod,
}: {
  icon: ReactNode;
  accent: string;
  title: string;
  detail: string;
  price: string;
  pricePeriod: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklab, ${accent} 12%, transparent)`,
          color: accent,
        }}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-foreground text-sm font-semibold">{title}</p>
          <p className="text-muted text-sm leading-relaxed">{detail}</p>
        </div>
        <div className="shrink-0 text-right whitespace-nowrap">
          <p className="text-foreground text-sm font-semibold tabular-nums">
            <span>{price}</span>
            <span className="text-muted ml-1 text-xs font-normal">{pricePeriod}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function fallbackPolicy(domain: string, id: string): GeneratedDocument {
  const today = new Date().toISOString().slice(0, 10);
  const year = Number(today.slice(0, 4));
  return {
    id,
    name: 'Privacy Policy',
    site: domain,
    createdDate: today,
    updatedDate: today,
    versions: [{ year, current: true, effectiveDate: today, changeSummary: 'initial' }],
  };
}

/**
 * Isolated end screen — no top bar, step bar or wizard footer.
 * Activation: confirms the double opt-in email after registration.
 * Policy ready: logged-in users finish the wizard and open the hosted policy.
 */
export function AccountActivationScreen(props: AccountActivationScreenProps) {
  const { domain, euRep, fillSubscriptionId, variant } = props;
  const t = useTranslations('result.summary.activate');
  const tPolicyReady = useTranslations('result.policyReady');
  const session = useSession();
  const subscriptions = useSubscriptions();
  const router = useRouter();
  const startTrial = useStartPolicyTrial();
  const withEuRep = isBuyingEuRep(euRep);
  const isPolicyReady = variant === 'policyReady';

  const pricing = useMemo(() => {
    const isAuthenticated = Boolean(session.data?.email && session.data.emailVerified);
    const activePolicySiteCount =
      isAuthenticated && subscriptions.data ? countActivePolicySites(subscriptions.data) : 0;

    return calculateActivationOrderPricing(euRep, {
      fillSubscriptionId,
      activePolicySiteCount,
    });
  }, [euRep, fillSubscriptionId, session.data, subscriptions.data]);

  const pricePeriod = t('pricePeriod');

  function goToPolicyPreview(policyDocument: GeneratedDocument) {
    clearWizardState();
    router.push(
      privacyPolicyAccountHref({
        site: resolveDocumentSite(policyDocument),
        tab: 'preview',
      })
    );
  }

  async function handleShowPolicy() {
    if (variant !== 'policyReady') return;

    if (props.document) {
      goToPolicyPreview(props.document);
      return;
    }

    if (!props.formData) {
      toast.error(tPolicyReady('failed'));
      return;
    }

    try {
      const result = await startTrial.mutateAsync(
        buildTrialCheckoutPayload(domain, props.formData, euRep, fillSubscriptionId)
      );
      const next =
        result.document ??
        (result.documentId ? fallbackPolicy(domain, result.documentId) : undefined);
      if (!next) {
        toast.error(tPolicyReady('failed'));
        return;
      }
      goToPolicyPreview(next);
    } catch {
      toast.error(tPolicyReady('failed'));
    }
  }

  return (
    <main className="bg-background flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <span
            className={
              isPolicyReady
                ? 'bg-success-soft flex size-14 items-center justify-center rounded-2xl'
                : 'bg-key-50 flex size-14 items-center justify-center rounded-2xl'
            }
          >
            {isPolicyReady ? (
              <CheckCircle size={28} weight="fill" className="text-success" aria-hidden />
            ) : (
              <EnvelopeSimple size={28} weight="fill" className="text-accent" aria-hidden />
            )}
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">
              {isPolicyReady ? tPolicyReady(withEuRep ? 'titleWithEuRep' : 'title') : t('title')}
            </h1>
            {!isPolicyReady ? (
              <p className="text-foreground text-base leading-relaxed text-pretty">
                {t.rich('body', {
                  email: variant === 'activation' ? props.email : '',
                  strong: (chunks) => <span className="font-semibold">{chunks}</span>,
                })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="border-border overflow-hidden rounded-2xl border">
            <div className="border-border border-b px-5 py-4 sm:px-6">
              <p className="font-display text-foreground text-sm font-semibold">
                {t('servicesTitle')}
              </p>
            </div>

            <div className="divide-border divide-y">
              <ServiceRow
                icon={<FileText size={18} weight="fill" aria-hidden />}
                accent="var(--accent)"
                title={t('policyTitle')}
                detail={t('policyDetail', { domain })}
                price={formatCheckoutChf(pricing.policyAmount)}
                pricePeriod={pricePeriod}
              />
              {withEuRep ? (
                <ServiceRow
                  icon={<FlagBanner size={18} weight="fill" aria-hidden />}
                  accent="var(--feature-indigo)"
                  title={t('euRepTitle')}
                  detail={
                    euRep.legalEntity?.trim()
                      ? t('euRepDetail', { entity: euRep.legalEntity.trim() })
                      : t('euRepDetailFallback')
                  }
                  price={formatCheckoutChf(pricing.euRepAmount)}
                  pricePeriod={pricePeriod}
                />
              ) : null}
            </div>
          </section>

          <TrialPeriodNotice variant={withEuRep ? 'policyAndEuRep' : 'policy'} showPaymentHint />
        </div>

        <div className="flex flex-col items-center text-center">
          {isPolicyReady ? (
            <Button
              variant="primary"
              size="lg"
              className="font-display h-14 gap-2 rounded-full px-8 text-base"
              onPress={() => void handleShowPolicy()}
              isDisabled={startTrial.isPending}
            >
              {startTrial.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" aria-hidden />
                  {tPolicyReady('loading')}
                </span>
              ) : (
                <>
                  {tPolicyReady('showPolicy')}
                  <CaretRight size={16} weight="bold" aria-hidden />
                </>
              )}
            </Button>
          ) : (
            <NavigationLink href="/" chevron="right">
              {t('goHome')}
            </NavigationLink>
          )}
        </div>
      </div>
    </main>
  );
}
