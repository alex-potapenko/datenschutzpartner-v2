'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAccountSnapshot, useProfile } from '@/api/account';
import { useSession } from '@/api/auth';
import {
  useOrders,
  useSubscriptions,
  type BillingProductType,
  type Order,
  type Subscription,
} from '@/api/billing';
import { useDocuments, useGeneratorPlan } from '@/api/documents';
import { canUpgradeGeneratorPlan, type GeneratorPlanId } from '@/api/checkout';
import {
  AcademySessionSummary,
  upcomingEventHref,
} from '@/app/academy/_components/academy-preview-list';
import {
  formatAcademyCompactTime,
  getUpcomingAcademyFeaturedEvent,
  resolveAcademyEventTitle,
} from '@/lib/academy-content/events';
import {
  Button,
  FileText,
  GraduationCap,
  GlobeHemisphereEast,
  Plus,
  Question,
  Spinner,
  Table,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PriceBlock } from '@/components/shared/PriceBlock';
import type { Locale } from '@/i18n/config';
import type { AccountSectionId } from '../account-sections';
import type { AccountDetailsTab } from './AccountDetailsSection';
import {
  AccountSection,
  AccountSectionFrame,
  AccountTable,
  DataState,
  InvoiceDownloadButton,
  formatMoney,
  useDateFormatter,
} from '../account-ui';

type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

function greetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / msPerDay));
}

function toLocalDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function membershipDaysState(
  subscriptionDate: string,
  renewalDate: string,
  now = new Date()
): { remainingDays: number; totalDays: number } {
  const totalDays = Math.max(1, calendarDaysBetween(subscriptionDate, renewalDate));
  const remainingDays = Math.min(totalDays, calendarDaysBetween(toLocalDateIso(now), renewalDate));

  return { remainingDays, totalDays };
}

const DASHBOARD_SECTION_EYEBROW_CLASS =
  'font-display text-muted text-xs font-semibold tracking-wide uppercase';

function ProgressBar({ value, max }: { value: number; max: number }) {
  const fraction = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <div
      className="bg-border h-2 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="bg-accent h-full rounded-full" style={{ width: `${fraction * 100}%` }} />
    </div>
  );
}

function DashboardSubscriptionPeriodBlock({
  title,
  period,
  daysLeftLabel,
}: {
  title: string;
  period: { remainingDays: number; totalDays: number } | null;
  daysLeftLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>{title}</p>
      {period ? (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <PriceBlock
              amount={String(period.remainingDays)}
              animatedAmount={period.remainingDays}
              className="min-w-0 shrink-0"
            />
            <p className="text-muted min-w-0 text-sm leading-snug">{daysLeftLabel}</p>
          </div>
          <ProgressBar value={period.remainingDays} max={period.totalDays} />
        </>
      ) : null}
    </div>
  );
}

const DASHBOARD_LAYOUT_COLUMNS = 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';
const RECENT_PAYMENTS_LIMIT = 20;

function DashboardCountWithAdd({
  addLabel,
  onAdd,
  actionVariant = 'add',
  children,
}: {
  addLabel?: string;
  onAdd?: () => void;
  actionVariant?: 'add' | 'upgrade';
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      {onAdd ? (
        actionVariant === 'upgrade' ? (
          <Button variant="outline" size="sm" className="shrink-0" onPress={onAdd}>
            {addLabel}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            isIconOnly
            aria-label={addLabel}
            className="size-9 shrink-0 rounded-full"
            onPress={onAdd}
          >
            <Plus size={14} weight="bold" aria-hidden />
          </Button>
        )
      ) : null}
    </div>
  );
}

function ProductSummaryCard({
  icon,
  iconColor,
  iconBackground,
  title,
  children,
  footer,
  className,
}: {
  icon: ReactNode;
  iconColor: string;
  iconBackground: string;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-5 p-6 sm:p-8 ${className ?? ''}`}>
      <div className="flex flex-col gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: iconBackground, color: iconColor }}
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="text-foreground text-base leading-snug font-semibold">{title}</h2>
      </div>
      {children}
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </div>
  );
}

export function DashboardSection({
  onNavigate,
}: {
  onNavigate: (section: AccountSectionId, options?: { tab?: AccountDetailsTab }) => void;
}) {
  const t = useTranslations('account.dashboard');
  const tGenerator = useTranslations('account.generatorPlan');
  const tPreview = useTranslations('academy.landing.preview');
  const tFooter = useTranslations('footer');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const formatDate = useDateFormatter();

  const profile = useProfile();
  const session = useSession();
  const snapshot = useAccountSnapshot();
  const documents = useDocuments();
  const plan = useGeneratorPlan();
  const subscriptions = useSubscriptions();
  const orders = useOrders();

  const isLoading =
    profile.isLoading ||
    session.isLoading ||
    snapshot.isLoading ||
    documents.isLoading ||
    plan.isLoading ||
    subscriptions.isLoading ||
    orders.isLoading;

  const firstName = profile.data?.firstName ?? profile.data?.displayName.split(' ')[0] ?? '';
  const [greetingKey] = useState<GreetingPeriod>(() => greetingPeriod(new Date()));

  const siteAllowance = plan.data?.siteAllowance ?? 0;
  const usedSites = documents.data?.length ?? 0;
  const remainingSites = Math.max(0, siteAllowance - usedSites);
  const hasAcademyMembership = session.data?.hasAcademyMembership ?? false;
  const membership = snapshot.data?.membership;

  const policySubscription = subscriptions.data?.find((row) => row.productType === 'policy');
  const euRepSubscription = subscriptions.data?.find((row) => row.productType === 'euRep');
  const academySubscription = subscriptions.data?.find((row) => row.productType === 'academy');
  const inquiryAllowance = snapshot.data?.euRepInquiryAllowance;
  const currentGeneratorPlanId =
    plan.data?.planId ?? (policySubscription?.planId as GeneratorPlanId | undefined);
  const canUpgradeSites =
    !plan.isLoading &&
    !subscriptions.isLoading &&
    canUpgradeGeneratorPlan(currentGeneratorPlanId, usedSites);
  const showMaxPlanNote = !canUpgradeSites && remainingSites === 0 && plan.data != null;
  const includedInquiries = inquiryAllowance?.included ?? 0;
  const remainingInquiries = Math.max(0, includedInquiries - (inquiryAllowance?.used ?? 0));

  const featuredEvent = getUpcomingAcademyFeaturedEvent(locale);
  const featuredTitle = featuredEvent ? resolveAcademyEventTitle(locale, featuredEvent) : undefined;

  const previewLabels = {
    webinarBadge: tPreview('webinarBadge'),
    newsQuestionsBadge: tPreview('newsQuestionsBadge'),
  };

  const membershipPeriod =
    membership && membership.subscriptionDate && membership.renewalDate
      ? membershipDaysState(membership.subscriptionDate, membership.renewalDate)
      : academySubscription && academySubscription.startDate && academySubscription.nextPaymentDate
        ? membershipDaysState(academySubscription.startDate, academySubscription.nextPaymentDate)
        : null;

  const policySubscriptionPeriod =
    policySubscription?.startDate && policySubscription.nextPaymentDate
      ? membershipDaysState(policySubscription.startDate, policySubscription.nextPaymentDate)
      : null;
  const euRepSubscriptionPeriod =
    euRepSubscription?.startDate && euRepSubscription.nextPaymentDate
      ? membershipDaysState(euRepSubscription.startDate, euRepSubscription.nextPaymentDate)
      : null;

  const recentOrders =
    orders.data
      ?.slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RECENT_PAYMENTS_LIMIT) ?? [];

  const renewalRows =
    subscriptions.data?.filter((row) => row.status === 'active' && row.nextPaymentDate) ?? [];

  const renewalTotal = renewalRows.reduce((sum, row) => sum + row.totals.total, 0);
  const renewalCurrency = renewalRows[0]?.totals.currency ?? 'CHF';

  function serviceLabel(productType: BillingProductType) {
    return t(`recentPayments.services.${productType}`);
  }

  function goToCheckout() {
    router.push('/account/generator/checkout');
  }

  if (isLoading) {
    return (
      <AccountSectionFrame
        title={t('title')}
        content={
          <div className="flex min-h-48 items-center justify-center py-12" aria-busy="true">
            <Spinner aria-label={t('loading')} />
          </div>
        }
      />
    );
  }

  return (
    <AccountSectionFrame
      title={t('title')}
      description={t(`greeting.${greetingKey}`, { name: firstName })}
      content={
        <div className="-mx-4 min-w-0 overflow-x-clip sm:-mx-8">
          <section aria-label={t('productsAriaLabel')} className="border-border border-b">
            <div
              className={`divide-border grid divide-y ${DASHBOARD_LAYOUT_COLUMNS} lg:divide-x lg:divide-y-0`}
            >
              <ProductSummaryCard
                icon={<FileText size={18} weight="fill" />}
                iconColor="var(--accent)"
                iconBackground="color-mix(in srgb, var(--accent) 12%, transparent)"
                title={t('products.privacyGenerator.title')}
              >
                <div className="flex min-w-0 flex-col gap-4">
                  {policySubscription ? (
                    <DashboardSubscriptionPeriodBlock
                      title={t('products.privacyGenerator.subscriptionTitle')}
                      period={policySubscriptionPeriod}
                      daysLeftLabel={t('products.privacyGenerator.daysLeft')}
                    />
                  ) : null}

                  <div
                    className={
                      policySubscription
                        ? 'border-border flex min-w-0 flex-col gap-3 border-t pt-4'
                        : 'flex min-w-0 flex-col gap-3'
                    }
                  >
                    <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>{tGenerator('title')}</p>
                    <DashboardCountWithAdd
                      addLabel={
                        canUpgradeSites
                          ? remainingSites === 0
                            ? tGenerator('upgrade')
                            : tGenerator('buyMore')
                          : undefined
                      }
                      actionVariant={canUpgradeSites && remainingSites === 0 ? 'upgrade' : 'add'}
                      onAdd={canUpgradeSites ? goToCheckout : undefined}
                    >
                      <PriceBlock
                        amount={String(remainingSites)}
                        animatedAmount={remainingSites}
                        className="min-w-0 flex-col items-start gap-1"
                      />
                    </DashboardCountWithAdd>
                    {showMaxPlanNote ? (
                      <p className="text-muted text-sm leading-relaxed">
                        {tGenerator('maxPlanNote')}{' '}
                        <NavigationLink
                          href="/contact?subject=generator"
                          size="sm"
                          chevron="none"
                          className="inline-flex"
                        >
                          {tGenerator('contactUs')}
                        </NavigationLink>
                      </p>
                    ) : null}
                  </div>
                </div>
              </ProductSummaryCard>

              <ProductSummaryCard
                icon={<GlobeHemisphereEast size={18} weight="fill" />}
                iconColor="var(--feature-red)"
                iconBackground="color-mix(in srgb, var(--feature-red) 12%, transparent)"
                title={t('products.euRep.title')}
              >
                {euRepSubscription && inquiryAllowance ? (
                  <div className="flex min-w-0 flex-col gap-4">
                    <DashboardSubscriptionPeriodBlock
                      title={t('products.euRep.subscriptionTitle')}
                      period={euRepSubscriptionPeriod}
                      daysLeftLabel={t('products.euRep.daysLeft')}
                    />

                    <div className="border-border flex min-w-0 flex-col gap-3 border-t pt-4">
                      <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>
                        {t('products.euRep.inquiriesTitle')}
                      </p>
                      <DashboardCountWithAdd
                        addLabel={t('products.euRep.addInquiry')}
                        onAdd={() => {
                          onNavigate('euRep');
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <PriceBlock
                            amount={String(remainingInquiries)}
                            animatedAmount={remainingInquiries}
                            className="min-w-0 shrink-0"
                          />
                          <p className="text-muted min-w-0 text-sm leading-snug">
                            {inquiryAllowance.currency}{' '}
                            {inquiryAllowance.furtherInquiryAmount.toFixed(0)}{' '}
                            {t('products.euRep.furtherInquiryNote')}
                          </p>
                        </div>
                      </DashboardCountWithAdd>
                    </div>
                  </div>
                ) : null}
                {!euRepSubscription ? (
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => {
                      onNavigate('euRep');
                    }}
                  >
                    {t('products.euRep.discover')}
                  </Button>
                ) : null}
              </ProductSummaryCard>

              <ProductSummaryCard
                icon={<GraduationCap size={18} weight="fill" />}
                iconColor="var(--feature-purple)"
                iconBackground="color-mix(in srgb, var(--feature-purple) 12%, transparent)"
                title={t('products.academy.title')}
              >
                {hasAcademyMembership && academySubscription ? (
                  <div className="flex min-w-0 flex-col gap-4">
                    {membershipPeriod ? (
                      <div className="flex min-w-0 flex-col gap-3">
                        <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>
                          {t('products.academy.membershipTitle')}
                        </p>
                        <div className="flex min-w-0 items-center gap-3">
                          <PriceBlock
                            amount={String(membershipPeriod.remainingDays)}
                            animatedAmount={membershipPeriod.remainingDays}
                            className="min-w-0 shrink-0"
                          />
                          <p className="text-muted min-w-0 text-sm leading-snug">
                            {t('products.academy.daysLeft')}
                          </p>
                        </div>
                        <ProgressBar
                          value={membershipPeriod.remainingDays}
                          max={membershipPeriod.totalDays}
                        />
                      </div>
                    ) : null}

                    {featuredEvent && featuredTitle ? (
                      <div className="border-border flex min-w-0 flex-col gap-3 border-t pt-4">
                        <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>
                          {t('products.academy.comingUpTitle')}
                        </p>
                        <AcademySessionSummary
                          type={featuredEvent.type}
                          title={
                            <NavigationLink
                              href={upcomingEventHref(featuredEvent)}
                              chevron="none"
                              className="block w-full leading-snug font-medium whitespace-normal"
                            >
                              {featuredTitle}
                            </NavigationLink>
                          }
                          meta={formatAcademyCompactTime(featuredEvent.liveAt, locale)}
                          webinarLabel={previewLabels.webinarBadge}
                          newsQuestionsLabel={previewLabels.newsQuestionsBadge}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!hasAcademyMembership ? (
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => {
                      onNavigate('academy');
                    }}
                  >
                    {t('products.academy.getMembership')}
                  </Button>
                ) : null}
              </ProductSummaryCard>
            </div>
          </section>

          <div
            className={`divide-border grid grid-cols-1 divide-y ${DASHBOARD_LAYOUT_COLUMNS} lg:divide-x lg:divide-y-0`}
          >
            <div className="divide-border flex min-w-0 flex-col divide-y lg:col-span-2">
              <AccountSection title={t('recentPayments.title')} contentClassName="gap-0">
                <DataState
                  isLoading={orders.isLoading}
                  isError={orders.isError}
                  onRetry={() => void orders.refetch()}
                >
                  {recentOrders.length > 0 ? (
                    <AccountTable aria-label={t('recentPayments.title')}>
                      <Table.Header>
                        <Table.Column isRowHeader>{t('recentPayments.colInvoice')}</Table.Column>
                        <Table.Column>{t('recentPayments.colDate')}</Table.Column>
                        <Table.Column className="text-right">
                          {t('recentPayments.colAmount')}
                        </Table.Column>
                        <Table.Column className="text-right">
                          <span className="sr-only">{t('recentPayments.downloadPdf')}</span>
                        </Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {recentOrders.map((order) => (
                          <RecentPaymentRow
                            key={order.id}
                            order={order}
                            formatDate={formatDate}
                            serviceLabel={serviceLabel(order.productType)}
                            downloadLabel={t('recentPayments.downloadPdf')}
                            onDownload={() => {
                              toast.success(t('recentPayments.downloadStarted'));
                            }}
                          />
                        ))}
                      </Table.Body>
                    </AccountTable>
                  ) : null}
                </DataState>
              </AccountSection>
            </div>

            <div className="divide-border flex min-w-0 flex-col divide-y">
              <AccountSection size="small" title={t('renewals.title')} contentClassName="gap-4">
                <ul className="flex flex-col gap-4">
                  {renewalRows.map((row) => (
                    <RenewalRow key={row.id} subscription={row} formatDate={formatDate} />
                  ))}
                </ul>
                {renewalRows.length > 0 ? (
                  <div className="border-border flex items-center justify-between gap-3 border-t pt-4 text-sm">
                    <span className="text-foreground font-semibold">
                      {t('renewals.totalNext12Months')}
                    </span>
                    <span className="text-foreground font-semibold">
                      {formatMoney(renewalTotal, renewalCurrency)}
                    </span>
                  </div>
                ) : null}
              </AccountSection>

              <AccountSection
                size="small"
                title={t('questions.title')}
                icon={<Question size={14} weight="fill" className="shrink-0" aria-hidden />}
              >
                <p className="text-foreground text-sm leading-relaxed">{t('questions.body')}</p>
                <NavigationLink href="/contact" size="sm">
                  {t('questions.contactUs')}
                </NavigationLink>
              </AccountSection>

              <AccountSection size="small" className="gap-1.5" contentClassName="gap-1.5">
                <NavigationLink href="/terms" size="sm">
                  {tFooter('termsOfService')}
                </NavigationLink>
                <NavigationLink href="/privacy" size="sm">
                  {tFooter('privacyPolicy')}
                </NavigationLink>
              </AccountSection>
            </div>
          </div>
        </div>
      }
    />
  );
}

function RecentPaymentRow({
  order,
  formatDate,
  serviceLabel,
  downloadLabel,
  onDownload,
}: {
  order: Order;
  formatDate: ReturnType<typeof useDateFormatter>;
  serviceLabel: string;
  downloadLabel: string;
  onDownload: () => void;
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-sm font-semibold">{order.number}</span>
          <span className="text-muted text-xs">{serviceLabel}</span>
        </div>
      </Table.Cell>
      <Table.Cell>{formatDate(order.date)}</Table.Cell>
      <Table.Cell className="text-right font-normal">
        {formatMoney(order.total, order.currency)}
      </Table.Cell>
      <Table.Cell className="text-right">
        <InvoiceDownloadButton label={downloadLabel} onPress={onDownload} />
      </Table.Cell>
    </Table.Row>
  );
}

function RenewalRow({
  subscription,
  formatDate,
}: {
  subscription: Subscription;
  formatDate: ReturnType<typeof useDateFormatter>;
}) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <span className="text-foreground text-sm font-semibold">{subscription.product}</span>
        <span className="text-foreground shrink-0 text-sm font-semibold">
          {formatMoney(subscription.totals.total, subscription.totals.currency)}
        </span>
      </div>
      <p className="text-muted text-sm">
        {subscription.nextPaymentDate ? formatDate(subscription.nextPaymentDate) : '—'}
      </p>
    </li>
  );
}
