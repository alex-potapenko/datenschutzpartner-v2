import type { CheckoutSessionDetails } from '@/api/checkout';

/** Text-only line on the Payrexx POC screen (no icons or per-line prices). */
export type PayrexxOrderItem = {
  title: string;
  detail: string;
};

export type PayrexxOrderLineLabels = {
  policyTitle: string;
  euRepTitle: string;
  policyDetail: (domain: string) => string;
  generatorSitesDetail: (count: number) => string;
  euRepDetail: (entity: string) => string;
  euRepDetailFallback: string;
  euRepPlanLine: (plan: string) => string;
  euRepPlanName?: (planId: string) => string;
  generatorHostingDetail: (domain: string) => string;
  renewalWebsitesDetail: (count: number) => string;
};

/** Line items for the Payrexx POC screen from a checkout session (redirect flow). */
export function payrexxOrderLinesFromSession(
  session: CheckoutSessionDetails,
  labels: PayrexxOrderLineLabels
): PayrexxOrderItem[] {
  const ctx = session.orderContext;
  const policyAmount = ctx?.policyAmountExclVat ?? 0;
  const euRepAmount = ctx?.euRepAmountExclVat ?? 0;
  const lines: PayrexxOrderItem[] = [];

  if (policyAmount > 0) {
    const domain = ctx?.domain ?? '';
    const siteCount = ctx?.siteCount ?? session.siteCount;
    lines.push({
      title: labels.policyTitle,
      detail: domain
        ? session.kind === 'subscriptionRenewal'
          ? labels.generatorHostingDetail(domain)
          : labels.policyDetail(domain)
        : session.kind === 'generator'
          ? labels.generatorSitesDetail(siteCount)
          : labels.renewalWebsitesDetail(siteCount),
    });
  }

  if (euRepAmount > 0) {
    const entity = ctx?.legalEntity?.trim() ?? '';
    const planLabel =
      ctx?.euRepPlanId && labels.euRepPlanName
        ? labels.euRepPlanName(ctx.euRepPlanId)
        : ctx?.euRepPlanLabel;
    lines.push({
      title: labels.euRepTitle,
      detail: planLabel
        ? entity
          ? `${planLabel} · ${labels.euRepDetail(entity)}`
          : planLabel
        : entity
          ? labels.euRepDetail(entity)
          : labels.euRepDetailFallback,
    });
  }

  return lines;
}

export function payrexxOrderLinesFromTrialCheckout(input: {
  domain: string;
  policyAmountExclVat: number;
  euRepAmountExclVat: number;
  legalEntity: string;
  labels: PayrexxOrderLineLabels;
}): PayrexxOrderItem[] {
  const lines: PayrexxOrderItem[] = [];
  if (input.policyAmountExclVat > 0) {
    lines.push({
      title: input.labels.policyTitle,
      detail: input.labels.policyDetail(input.domain),
    });
  }
  if (input.euRepAmountExclVat > 0) {
    const entity = input.legalEntity.trim();
    lines.push({
      title: input.labels.euRepTitle,
      detail: entity ? input.labels.euRepDetail(entity) : input.labels.euRepDetailFallback,
    });
  }
  return lines;
}

export function payrexxOrderLinesFromGeneratorCheckout(input: {
  siteCount: number;
  labels: PayrexxOrderLineLabels;
}): PayrexxOrderItem[] {
  return [
    {
      title: input.labels.policyTitle,
      detail: input.labels.generatorSitesDetail(input.siteCount),
    },
  ];
}

export function payrexxOrderLinesFromEuRepCheckout(input: {
  planLabel: string;
  legalEntity: string;
  labels: PayrexxOrderLineLabels;
}): PayrexxOrderItem[] {
  const entity = input.legalEntity.trim();
  return [
    {
      title: input.labels.euRepTitle,
      detail: entity ? `${input.planLabel} · ${input.labels.euRepDetail(entity)}` : input.planLabel,
    },
  ];
}
