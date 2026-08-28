'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  Spinner,
  Table,
  Tabs,
  cn,
  useOverlayState,
} from '@/components/ui';

type OverlayState = ReturnType<typeof useOverlayState>;

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

const ACCOUNT_SECTION_TITLE_SLOT = 'lg:col-start-2 lg:row-start-1';
const ACCOUNT_SECTION_TABS_SLOT = 'lg:col-start-2 lg:row-start-2';
const ACCOUNT_SECTION_BODY_SLOT =
  'lg:col-start-2 lg:row-start-4 lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col lg:self-stretch';

/** Full-viewport header divider — sits below the sidebar + section header row. */
export function AccountHeaderRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        '[margin-left:calc(50%-50vw)] h-px w-screen max-w-none shrink-0 [box-shadow:inset_0_-1px_0_0_var(--border)]',
        className
      )}
    />
  );
}

/** Page heading + optional secondary tabs — matches the Insights archive layout. */
export function AccountSectionFrame({
  title,
  action,
  description,
  tabsAriaLabel,
  tabs,
  selectedTab,
  onTabChange,
  children,
  content,
}: {
  title: string;
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

  const titleBlock = (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-6 sm:px-8 sm:pt-20 sm:pb-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h1>
          {description ? (
            <p className="text-muted max-w-2xl text-base leading-relaxed">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );

  if (hasTabs) {
    if (layout === 'split') {
      return (
        <Tabs
          variant="secondary"
          selectedKey={selectedTab}
          onSelectionChange={onTabChange}
          className="w-full gap-0 lg:contents"
        >
          <div className={cn('w-full', ACCOUNT_SECTION_TITLE_SLOT)}>{titleBlock}</div>
          <Tabs.ListContainer
            className={cn('overflow-x-auto px-4 sm:px-8', ACCOUNT_SECTION_TABS_SLOT)}
          >
            <Tabs.List aria-label={tabsAriaLabel} className="!w-auto max-w-full !border-b-0">
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id} className="!h-auto !w-auto shrink-0 pb-4">
                  <span className="text-base font-medium whitespace-nowrap">{tab.label}</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          <div className={cn('w-full min-w-0', ACCOUNT_SECTION_BODY_SLOT)}>{children}</div>
        </Tabs>
      );
    }

    const tabList = (
      <Tabs.ListContainer className="border-border overflow-x-auto border-b px-4 sm:px-8">
        <Tabs.List aria-label={tabsAriaLabel} className="!w-auto max-w-full !border-b-0">
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id} className="!h-auto !w-auto shrink-0 pb-4">
              <span className="text-base font-medium whitespace-nowrap">{tab.label}</span>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    );

    return (
      <>
        {titleBlock}
        <Tabs
          variant="secondary"
          selectedKey={selectedTab}
          onSelectionChange={onTabChange}
          className="w-full gap-0"
        >
          {tabList}
          {children}
        </Tabs>
      </>
    );
  }

  if (layout === 'split') {
    return (
      <>
        <div className={cn('w-full', ACCOUNT_SECTION_TITLE_SLOT)}>{titleBlock}</div>
        <div className={cn('w-full px-4 pb-8 sm:px-8', ACCOUNT_SECTION_BODY_SLOT)}>
          {content ?? children}
        </div>
      </>
    );
  }

  return (
    <>
      {titleBlock}
      <AccountHeaderRule />
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

/** Confirmation dialog for destructive actions (cancel subscription, log out). */
export function ConfirmDialog({
  state,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending,
}: {
  state: OverlayState;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{title}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <p className="text-muted text-sm leading-relaxed">{body}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--feature-red)]"
                isDisabled={isPending}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
