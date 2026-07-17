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
  usePaymentMethods,
  useSubscriptions,
  type BillingProductType,
  type Order,
  type PaymentMethod,
  type Subscription,
} from '@/api/billing';
import { useDocuments, useGeneratorPlan, type GeneratedDocument } from '@/api/documents';
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
  ArrowsClockwise,
  Button,
  Card,
  CardContent,
  CheckCircle,
  Chip,
  FileText,
  GraduationCap,
  GlobeHemisphereEast,
  Plus,
  Question,
  Spinner,
  Table,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PaymentCardBrandMark } from '@/components/shared/PaymentCardBrandMark';
import { PriceBlock } from '@/components/shared/PriceBlock';
import { StatusPill } from '@/components/shared/StatusPill';
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

function documentDisplayTitle(name: string): string {
  const [title] = name.split('—');
  return title?.trim() ?? name;
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

function ProgressBar({
  value,
  max,
  dangerWhenFull = false,
}: {
  value: number;
  max: number;
  dangerWhenFull?: boolean;
}) {
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  const isFull = value >= max;

  return (
    <div
      className="bg-border h-2 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        className={
          dangerWhenFull && isFull
            ? 'bg-danger h-full rounded-full'
            : 'bg-accent h-full rounded-full'
        }
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}

const DASHBOARD_LAYOUT_COLUMNS = 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]';

const DASHBOARD_SECTION_EYEBROW_CLASS =
  'font-display text-muted text-xs font-semibold tracking-wide uppercase';

function DashboardCountWithAdd({
  addLabel,
  onAdd,
  children,
}: {
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
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

function ServiceChip({ label }: { label: string }) {
  return (
    <Chip
      variant="soft"
      size="sm"
      className="[--chip-bg:color-mix(in_srgb,var(--accent)_10%,transparent)] [--chip-fg:var(--accent)]"
    >
      {label}
    </Chip>
  );
}

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function paymentMethodUsedByLabel(
  methodId: string,
  subscriptions: Subscription[],
  t: ReturnType<typeof useTranslations<'account.dashboard.paymentMethods'>>
): string | undefined {
  const productTypes = subscriptions
    .filter((row) => row.paymentMethodId === methodId && row.status !== 'cancelled')
    .map((row) => row.productType);

  if (productTypes.includes('academy') || productTypes.includes('policy')) {
    return t('usedBy.academyAndPolicy');
  }

  if (productTypes.includes('euRep')) {
    return t('usedBy.euRep');
  }

  return undefined;
}

export function DashboardSection({
  onNavigate,
}: {
  onNavigate: (section: AccountSectionId, options?: { tab?: AccountDetailsTab }) => void;
}) {
  const t = useTranslations('account.dashboard');
  const tGenerator = useTranslations('account.generatorPlan');
  const tDocuments = useTranslations('account.documents');
  const tPaymentMethods = useTranslations('account.dashboard.paymentMethods');
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
  const paymentMethods = usePaymentMethods();

  const isLoading =
    profile.isLoading ||
    session.isLoading ||
    snapshot.isLoading ||
    documents.isLoading ||
    plan.isLoading ||
    subscriptions.isLoading ||
    orders.isLoading ||
    paymentMethods.isLoading;

  const firstName = profile.data?.firstName ?? profile.data?.displayName.split(' ')[0] ?? '';
  const [greetingKey] = useState<GreetingPeriod>(() => greetingPeriod(new Date()));

  const siteAllowance = plan.data?.siteAllowance ?? 0;
  const usedSites = documents.data?.length ?? 0;
  const remainingSites = Math.max(0, siteAllowance - usedSites);
  const updatesNeeded = documents.data?.filter((doc) => doc.status === 'updateAvailable') ?? [];
  const upToDateCount = documents.data?.filter((doc) => doc.status === 'upToDate').length ?? 0;
  const hasAcademyMembership = session.data?.hasAcademyMembership ?? false;
  const membership = snapshot.data?.membership;

  const euRepSubscription = subscriptions.data?.find((row) => row.productType === 'euRep');
  const academySubscription = subscriptions.data?.find((row) => row.productType === 'academy');
  const inquiryAllowance = snapshot.data?.euRepInquiryAllowance;
  const includedInquiries = inquiryAllowance?.included ?? 0;
  const usedInquiries = inquiryAllowance?.used ?? 0;
  const remainingInquiries = Math.max(0, includedInquiries - usedInquiries);

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

  const recentOrders =
    orders.data
      ?.slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4) ?? [];

  const renewalRows =
    subscriptions.data?.filter(
      (row) => row.status === 'active' && row.nextPaymentDate && row.productType !== 'policy'
    ) ?? [];

  const renewalTotal = renewalRows.reduce((sum, row) => sum + row.totals.total, 0);
  const renewalCurrency = renewalRows[0]?.totals.currency ?? 'CHF';

  function serviceLabel(productType: BillingProductType) {
    return t(`recentPayments.services.${productType}`);
  }

  function goToScan() {
    router.push('/scan');
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
                  <div className="flex min-w-0 flex-col gap-3">
                    <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>{tGenerator('title')}</p>
                    <DashboardCountWithAdd addLabel={tGenerator('buyMore')} onAdd={goToScan}>
                      <PriceBlock
                        amount={String(remainingSites)}
                        animatedAmount={remainingSites}
                        className="min-w-0 flex-col items-start gap-1"
                      />
                    </DashboardCountWithAdd>
                    <ProgressBar value={usedSites} max={siteAllowance} dangerWhenFull />
                  </div>

                  <div className="border-border flex min-w-0 flex-col gap-3 border-t pt-4">
                    <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>{tDocuments('countTitle')}</p>
                    <DashboardCountWithAdd addLabel={tDocuments('create')} onAdd={goToScan}>
                      <PriceBlock
                        amount={String(usedSites)}
                        animatedAmount={usedSites}
                        size="sm"
                        className="min-w-0 flex-col items-start gap-1"
                      />
                    </DashboardCountWithAdd>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-foreground inline-flex items-center gap-1.5">
                        <CheckCircle
                          size={14}
                          weight="fill"
                          className="text-success shrink-0"
                          aria-hidden
                        />
                        {tDocuments('countUpToDate', { count: upToDateCount })}
                      </span>
                      {updatesNeeded.length > 0 ? (
                        <>
                          <span className="text-muted" aria-hidden>
                            ·
                          </span>
                          <span className="text-foreground inline-flex items-center gap-1.5">
                            <ArrowsClockwise
                              size={14}
                              weight="bold"
                              className="text-warning shrink-0"
                              aria-hidden
                            />
                            {tDocuments('countUpdateAvailable', { count: updatesNeeded.length })}
                          </span>
                        </>
                      ) : null}
                    </div>
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
                    <div className="flex min-w-0 flex-col gap-3">
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
                      <ProgressBar value={usedInquiries} max={includedInquiries} dangerWhenFull />
                    </div>

                    <div className="border-border flex min-w-0 flex-col gap-3 border-t pt-4">
                      <p className={DASHBOARD_SECTION_EYEBROW_CLASS}>
                        {t('products.euRep.subscriptionTitle')}
                      </p>
                      <PriceBlock
                        currency={euRepSubscription.totals.currency}
                        amount={euRepSubscription.totals.total.toFixed(2)}
                        animatedAmount={euRepSubscription.totals.total}
                        notes={[t('products.euRep.subscriptionPerYear'), euRepSubscription.product]}
                        size="sm"
                        className="min-w-0"
                      />
                      {euRepSubscription.nextPaymentDate ? (
                        <p className="text-muted text-sm">
                          {t('products.euRep.renewsOn', {
                            date: formatDate(euRepSubscription.nextPaymentDate),
                          })}
                        </p>
                      ) : null}
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
              <AccountSection
                title={t('attention.title')}
                titleAside={
                  updatesNeeded.length > 0 ? (
                    <StatusPill tone="warning">{updatesNeeded.length}</StatusPill>
                  ) : undefined
                }
                contentClassName="gap-4"
              >
                {updatesNeeded.length === 0 ? (
                  <p className="text-muted text-sm">{t('attention.empty')}</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {updatesNeeded.map((doc) => (
                      <PolicyUpdateCardItem
                        key={doc.id}
                        document={doc}
                        updateLabel={t('attention.update')}
                        sinceLabel={t('attention.updateAvailableSince', {
                          date: formatDate(doc.updateAvailableSince ?? doc.createdDate),
                        })}
                        onUpdate={() => {
                          onNavigate('generator');
                        }}
                      />
                    ))}
                  </div>
                )}
              </AccountSection>

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
                        <Table.Column>{t('recentPayments.colService')}</Table.Column>
                        <Table.Column>{t('recentPayments.colDate')}</Table.Column>
                        <Table.Column className="text-right">
                          {t('recentPayments.colAmount')}
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
                  {renewalRows.map((row) => {
                    const method = paymentMethods.data?.find(
                      (entry) => entry.id === row.paymentMethodId
                    );
                    return (
                      <RenewalRow
                        key={row.id}
                        subscription={row}
                        paymentMethod={method}
                        formatDate={formatDate}
                      />
                    );
                  })}
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
                title={t('paymentMethods.title')}
                action={
                  <NavigationLink
                    onPress={() => {
                      onNavigate('accountDetails', { tab: 'paymentDetails' });
                    }}
                    size="sm"
                    chevron="none"
                    className="shrink-0"
                  >
                    {t('paymentMethods.manage')}
                  </NavigationLink>
                }
                contentClassName="gap-4"
              >
                <ul className="flex flex-col gap-4">
                  {paymentMethods.data?.map((method) => (
                    <PaymentMethodRow
                      key={method.id}
                      method={method}
                      usedBy={
                        subscriptions.data
                          ? paymentMethodUsedByLabel(method.id, subscriptions.data, tPaymentMethods)
                          : undefined
                      }
                      expiresLabel={
                        method.expMonth != null && method.expYear != null
                          ? t('renewals.cardExpires', {
                              month: String(method.expMonth).padStart(2, '0'),
                              year: String(method.expYear),
                            })
                          : undefined
                      }
                    />
                  ))}
                </ul>
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

function PolicyUpdateCardItem({
  document,
  updateLabel,
  sinceLabel,
  onUpdate,
}: {
  document: GeneratedDocument;
  updateLabel: string;
  sinceLabel: string;
  onUpdate: () => void;
}) {
  const subtitle = document.siteUrl ? `${document.siteUrl} · ${sinceLabel}` : sinceLabel;

  return (
    <Card className="w-full min-w-0 !gap-4">
      <CardContent className="!flex !flex-row items-center gap-3">
        <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
          <FileText size={16} weight="fill" aria-hidden />
        </span>
        <div className="text-foreground min-w-0 flex-1 text-sm leading-relaxed">
          <p className="truncate font-semibold">{documentDisplayTitle(document.name)}</p>
          <p className="text-muted truncate">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onPress={onUpdate}>
          {updateLabel}
        </Button>
      </CardContent>
    </Card>
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
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{order.number}</span>
          <InvoiceDownloadButton label={downloadLabel} onPress={onDownload} />
        </div>
      </Table.Cell>
      <Table.Cell>
        <ServiceChip label={serviceLabel} />
      </Table.Cell>
      <Table.Cell>{formatDate(order.date)}</Table.Cell>
      <Table.Cell className="text-right font-normal">
        {formatMoney(order.total, order.currency)}
      </Table.Cell>
    </Table.Row>
  );
}

function RenewalRow({
  subscription,
  paymentMethod,
  formatDate,
}: {
  subscription: Subscription;
  paymentMethod?: PaymentMethod;
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
        {paymentMethod?.brand && paymentMethod.last4
          ? ` · ${formatCardBrand(paymentMethod.brand)} •••• ${paymentMethod.last4}`
          : null}
      </p>
    </li>
  );
}

function PaymentMethodRow({
  method,
  usedBy,
  expiresLabel,
}: {
  method: PaymentMethod;
  usedBy?: string;
  expiresLabel?: string;
}) {
  return (
    <li className="flex items-start gap-3">
      {method.brand ? (
        <PaymentCardBrandMark brand={method.brand} className="mt-0.5 shrink-0" />
      ) : null}
      <div className="min-w-0">
        <p className="text-foreground text-sm font-semibold">
          {method.brand && method.last4
            ? `${formatCardBrand(method.brand)} •••• ${method.last4}`
            : method.label}
        </p>
        {expiresLabel ? <p className="text-muted text-xs">{expiresLabel}</p> : null}
        {usedBy ? <p className="text-muted mt-1 text-xs">{usedBy}</p> : null}
      </div>
    </li>
  );
}
