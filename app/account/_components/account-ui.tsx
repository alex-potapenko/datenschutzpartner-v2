'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import { createContext, useContext } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatDiscountPercent } from '@/api/checkout';
import { NavigationLink } from '@/components/shared/NavigationLink';
import {
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/components/shared/secondary-tab-styles';
import {
  Button,
  CaretDown,
  Check,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownRoot,
  DropdownTrigger,
  FileText,
  Plus,
  Spinner,
  Table,
  Tabs,
  cn,
} from '@/components/ui';

type AccountLayoutMode = 'split' | 'stack';

const AccountLayoutContext = createContext<AccountLayoutMode>('stack');

export function AccountLayoutProvider({
  mode,
  children,
}: {
  mode: AccountLayoutMode;
  children: ReactNode;
}) {
  return <AccountLayoutContext.Provider value={mode}>{children}</AccountLayoutContext.Provider>;
}

function useAccountLayout() {
  return useContext(AccountLayoutContext);
}

const ACCOUNT_SECTION_BODY_PADDING = 'px-4 pb-8 sm:px-8';

/** Bottom edge rule for section headers — applied on the header itself, not a sibling. */
export const ACCOUNT_SECTION_HEADER_SHADOW = '[box-shadow:inset_0_-1px_0_0_var(--border)]';

/*
 * HeroUI only applies its `secondary` tab styling to a `.tabs__list-container` that is a direct
 * child of the `Tabs` root. Account headers nest the list inside the title block, so the look is
 * applied explicitly here instead of relying on the variant.
 */
export {
  SECONDARY_TABS_INDICATOR_CLASS,
  SECONDARY_TABS_LIST_CLASS,
  SECONDARY_TABS_TAB_CLASS,
} from '@/components/shared/secondary-tab-styles';

/** Page heading + optional secondary tabs — matches the Insights archive layout. */
export function AccountSectionFrame({
  title,
  hideTitle = false,
  flush = false,
  action,
  description,
  tabsAriaLabel,
  tabs,
  selectedTab,
  onTabChange,
  children,
  content,
}: {
  title?: string;
  /** When true, omits the page heading (and split-layout divider) — e.g. embedded service landings. */
  hideTitle?: boolean;
  /** Full-bleed body — no bottom padding (e.g. coming-soon hero). */
  flush?: boolean;
  action?: ReactNode;
  /** Optional lead line under the page title — e.g. a personalised dashboard greeting. */
  description?: ReactNode;
  tabsAriaLabel?: string;
  tabs?: ReadonlyArray<{ id: string; label: string }>;
  selectedTab?: string;
  onTabChange?: (key: React.Key) => void;
  children?: ReactNode;
  content?: ReactNode;
}) {
  const hasTabs =
    tabs !== undefined &&
    tabsAriaLabel !== undefined &&
    selectedTab !== undefined &&
    onTabChange !== undefined;

  const layout = useAccountLayout();
  const bodyPadding = flush ? 'px-4 sm:px-8' : ACCOUNT_SECTION_BODY_PADDING;

  function renderTabList(className?: string) {
    if (!hasTabs) return null;

    return (
      <Tabs.ListContainer className={cn('overflow-x-auto px-4 sm:px-8', className)}>
        <Tabs.List aria-label={tabsAriaLabel} className={SECONDARY_TABS_LIST_CLASS}>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id} className={SECONDARY_TABS_TAB_CLASS}>
              <span className="text-base font-medium whitespace-nowrap">{tab.label}</span>
              <Tabs.Indicator className={SECONDARY_TABS_INDICATOR_CLASS} />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    );
  }

  const titleRow = (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h1>
        {description ? (
          <p className="text-muted max-w-2xl text-base leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  const titleBlock = (
    <div
      className={cn(
        'flex h-full flex-col justify-center px-4 sm:px-8',
        ACCOUNT_SECTION_HEADER_SHADOW,
        hasTabs ? 'pt-10' : 'pt-10 pb-8'
      )}
    >
      {titleRow}
    </div>
  );

  if (hasTabs) {
    const tabList = (
      <Tabs
        variant="secondary"
        selectedKey={selectedTab}
        onSelectionChange={onTabChange}
        className="w-full gap-0"
      >
        {renderTabList('!px-0')}
      </Tabs>
    );

    if (layout === 'split') {
      return (
        <div className="flex w-full flex-col gap-0">
          <div
            className={cn(
              'flex w-full flex-col justify-center gap-10 px-4 pt-10 sm:px-8',
              ACCOUNT_SECTION_HEADER_SHADOW
            )}
          >
            {titleRow}
            {tabList}
          </div>
          <div className={cn('w-full min-w-0 overflow-x-clip', ACCOUNT_SECTION_BODY_PADDING)}>
            {children}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-0">
        <div
          className={cn('flex flex-col gap-10 px-4 pt-10 sm:px-8', ACCOUNT_SECTION_HEADER_SHADOW)}
        >
          {titleRow}
          {tabList}
        </div>
        <div className={cn('min-w-0 overflow-x-clip', ACCOUNT_SECTION_BODY_PADDING)}>
          {children}
        </div>
      </div>
    );
  }

  if (layout === 'split') {
    if (hideTitle) {
      return (
        <div className={cn('w-full min-w-0 overflow-visible', bodyPadding)}>
          {content ?? children}
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col">
        {titleBlock}
        <div className={cn('w-full min-w-0 overflow-x-clip', ACCOUNT_SECTION_BODY_PADDING)}>
          {content ?? children}
        </div>
      </div>
    );
  }

  if (hideTitle) {
    return (
      <div className={flush ? 'px-4 sm:px-8' : 'px-4 pb-8 sm:px-8'}>{content ?? children}</div>
    );
  }

  return (
    <>
      {titleBlock}
      <div className="px-4 pb-8 sm:px-8">{content ?? children}</div>
    </>
  );
}

export const ACCOUNT_TAB_PANEL_CLASS = '!mt-0 p-0';

export type AccountSectionSize = 'default' | 'small';

const ACCOUNT_SECTION_SIZE: Record<
  AccountSectionSize,
  { padding: string; sectionGap: string; contentGap: string; title: string }
> = {
  default: {
    padding: 'p-8',
    sectionGap: 'gap-8',
    contentGap: 'gap-8',
    title: 'text-foreground text-lg font-semibold',
  },
  small: {
    padding: 'p-6',
    sectionGap: 'gap-5',
    contentGap: 'gap-3',
    title:
      'font-display text-muted inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-wide uppercase',
  },
};

/**
 * Member-area section shell — wide column (default) or sidebar column (small).
 * Optional eyebrow icon and header action mirror Payment details / membership layouts.
 */
export function AccountSection({
  size = 'default',
  title,
  icon,
  action,
  titleAside,
  children,
  className,
  contentClassName,
}: {
  size?: AccountSectionSize;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  titleAside?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const styles = ACCOUNT_SECTION_SIZE[size];
  const hasHeader = Boolean(title || action);

  return (
    <section className={cn('flex min-w-0 flex-col', styles.padding, styles.sectionGap, className)}>
      {hasHeader ? (
        <div className="flex items-center justify-between gap-3">
          {title ? (
            size === 'small' ? (
              <p className={styles.title}>
                {icon}
                {title}
              </p>
            ) : (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className={styles.title}>{title}</h2>
                {titleAside}
              </div>
            )
          ) : (
            <span aria-hidden />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children ? (
        <div className={cn('flex min-w-0 flex-col', styles.contentGap, contentClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function toLocalDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / msPerDay));
}

/** Remaining / total calendar days on a subscription term. */
export function subscriptionDaysLeft(
  startDate: string,
  nextPaymentDate: string,
  now = new Date()
): { remainingDays: number; totalDays: number } {
  const totalDays = Math.max(1, calendarDaysBetween(startDate, nextPaymentDate));
  const remainingDays = Math.min(
    totalDays,
    calendarDaysBetween(toLocalDateIso(now), nextPaymentDate)
  );
  return { remainingDays, totalDays };
}

export function DaysLeftDonut({
  remaining,
  total,
  label,
  variant = 'default',
}: {
  remaining: number;
  total: number;
  label: string;
  variant?: 'default' | 'trial';
}) {
  const size = 16;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const remainingFraction = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const remainingLength = circumference * remainingFraction;
  const elapsedLength = circumference - remainingLength;
  const isUrgent = remaining < 30;
  const progressStroke =
    variant === 'trial'
      ? 'var(--warning-soft-foreground, var(--warning))'
      : isUrgent
        ? 'var(--feature-red)'
        : 'var(--accent)';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="size-4 shrink-0"
      overflow="visible"
      role="img"
      aria-label={label}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressStroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${remainingLength} ${circumference}`}
          strokeDashoffset={-elapsedLength}
        />
      </g>
    </svg>
  );
}

export function DaysLeftBar({
  remaining,
  total,
  label,
  urgentRemainingAtMost = 30,
}: {
  remaining: number;
  total: number;
  label: string;
  /** Bar turns red when remaining days are at or below this threshold. */
  urgentRemainingAtMost?: number;
}) {
  const remainingFraction = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const isUrgent = remaining <= urgentRemainingAtMost;
  const percent = Math.round(remainingFraction * 100);

  return (
    <div
      className="bg-border h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={remaining}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${percent}%`,
          background: isUrgent ? 'var(--feature-red)' : 'var(--accent)',
        }}
      />
    </div>
  );
}

export function CountWithAdd({
  addLabel,
  onAdd,
  withPlus = false,
  children,
}: {
  addLabel?: string;
  onAdd?: () => void;
  withPlus?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      {onAdd ? (
        <Button variant="outline" size="sm" className="shrink-0 gap-2" onPress={onAdd}>
          {withPlus ? <Plus size={14} weight="bold" aria-hidden /> : null}
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** HeroUI table with the member area's default primary styling. */
export function AccountTable({
  'aria-label': ariaLabel,
  children,
  className,
}: {
  'aria-label': string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Table variant="primary" aria-label={ariaLabel} className={className}>
      <Table.ScrollContainer>
        <Table.Content>{children}</Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

/** Prevents a nested control inside a clickable table row from triggering row navigation. */
export function TableRowAction({ children }: { children: ReactNode }) {
  const stop = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- stops row navigation for nested controls
    <span
      className="inline-flex"
      onClick={stop}
      onPointerDown={stop}
      onPointerUp={stop}
      onKeyDown={stop}
    >
      {children}
    </span>
  );
}

/** Round outline control to download an invoice from billing-history tables. */
export function InvoiceDownloadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      isIconOnly
      className="size-8 rounded-full"
      aria-label={label}
      onPress={onPress}
    >
      <FileText size={12} aria-hidden />
    </Button>
  );
}

export function AccountFilterDropdown<T extends string>({
  ariaLabel,
  value,
  onChange,
  items,
}: {
  ariaLabel: string;
  value: T;
  onChange: (value: T) => void;
  items: ReadonlyArray<{ id: T; label: string; icon?: ReactNode }>;
}) {
  const activeItem = items.find((item) => item.id === value) ?? items[0];
  if (!activeItem) return null;

  return (
    <DropdownRoot>
      <DropdownTrigger
        aria-label={ariaLabel}
        className={cn(
          'font-display button button--sm button--outline inline-flex shrink-0 items-center gap-2 whitespace-nowrap'
        )}
      >
        {activeItem.icon}
        {activeItem.label}
        <CaretDown size={14} aria-hidden />
      </DropdownTrigger>
      <DropdownPopover placement="bottom start" className="min-w-44">
        <DropdownMenu
          aria-label={ariaLabel}
          selectionMode="single"
          selectedKeys={new Set([value])}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next) {
              onChange(String(next) as T);
            }
          }}
        >
          {items.map((item) => (
            <DropdownItem key={item.id} id={item.id} textValue={item.label}>
              <span className="inline-flex w-full items-center gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {item.id === value ? <Check size={14} weight="bold" aria-hidden /> : null}
                </span>
                {item.icon}
                {item.label}
              </span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownPopover>
    </DropdownRoot>
  );
}

/** Section heading with an optional primary action on the right. */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="text-muted text-sm leading-relaxed">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Bordered content card — the member area's primary surface. */
export function AccountPanel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn('border-border bg-background overflow-hidden rounded-2xl border', className)}
    >
      {title ? (
        <header className="border-border flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Label/value row used across billing and address detail views. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="text-foreground text-sm font-medium sm:text-right">{children}</dd>
    </div>
  );
}

/**
 * Uniform loading / error handling for a section's query. Renders a skeleton
 * spinner while loading and an inline, actionable error on failure.
 */
export function DataState({
  isLoading,
  isError,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  const t = useTranslations('account');

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center" aria-busy="true">
        <Spinner aria-label={t('loading')} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-border flex flex-col items-start gap-3 rounded-2xl border border-dashed p-6">
        <p className="text-foreground text-sm" role="alert">
          {t('error')}
        </p>
        <Button variant="outline" size="sm" onPress={onRetry}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

/** Guidance-first empty state with an optional next action. */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="border-border flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
      <p className="text-muted max-w-sm text-sm leading-relaxed">{message}</p>
      {action}
    </div>
  );
}

/** Formats an ISO date string using the active locale, date-only (numeric). */
export function useDateFormatter() {
  const locale = useLocale();
  const intlLocale = locale === 'de' ? 'de-CH' : 'en-GB';

  return (iso: string | null | undefined) => {
    if (!iso) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
}

export function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}

export function OrderAmount({
  total,
  currency,
  discountRate,
  discountAmount,
}: {
  total: number;
  currency: string;
  discountRate?: number;
  discountAmount?: number;
}) {
  const t = useTranslations('account.generatorPlan');
  const percent = discountRate && discountRate > 0 ? formatDiscountPercent(discountRate) : null;
  const hasDiscount = Boolean(percent && discountAmount && discountAmount > 0);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-foreground font-normal">{formatMoney(total, currency)}</span>
      {hasDiscount && percent ? (
        <span className="text-success text-xs">
          {t('discountNote', {
            percent,
            amount: formatMoney(discountAmount ?? 0, currency),
          })}
        </span>
      ) : null}
    </div>
  );
}

export { ConfirmDialog } from '@/components/shared/ConfirmDialog';
