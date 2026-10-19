import { type ReactNode } from 'react';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { FullBleedDivider } from '@/components/shared/FullBleedDivider';
import { cn } from '@/lib/utils';

interface RegularPageProps {
  /** Optional page-level heading rendered in its own top section with a bottom border. */
  header?: ReactNode;
  /** Optional media block rendered between the header and the main content (e.g. a hero image). */
  media?: ReactNode;
  /** Highlights the matching item in the top navigation. */
  activePath?: string;
  /** Fallback destination when there is no browser history (e.g. direct entry). */
  backLink?: {
    href: string;
    label: string;
    preferHref?: boolean;
    iconOnly?: boolean;
    detailTitle?: string;
    onPress?: () => void;
  };
  /** When false, the logo is hidden in the TopBar (e.g. on insight article pages). */
  showLogo?: boolean;
  /** When true, the TopBar shows only the back link. */
  minimal?: boolean;
  /** When false, the TopBar is omitted (e.g. focused detail views with an inline back control). */
  showTopBar?: boolean;
  /** Account area: wordmark reads "My Account", no site nav or auth button. */
  topBarVariant?: 'public' | 'account';
  /** When false, the site footer is omitted (e.g. focused flows like questionnaires). */
  showFooter?: boolean;
  /**
   * When true the content area has no padding — useful when the page needs to render
   * full-bleed column layouts (e.g. a two-column contact layout with an inner border-r).
   */
  noPadding?: boolean;
  /** Full-width blocks after the bordered content column (e.g. newsletter on insight articles). */
  trailing?: ReactNode;
  /** Content height only — no flex growth below short pages (e.g. insight article detail). */
  shrinkWrapContent?: boolean;
  children: ReactNode;
}

/**
 * Full-width page shell — same grid width as TopBar and Footer.
 * Optionally accepts a `header` slot that renders as a separate div above the content.
 */
export function RegularPage({
  header,
  media,
  activePath,
  backLink,
  showLogo,
  minimal,
  showTopBar = true,
  topBarVariant,
  showFooter = true,
  noPadding = false,
  trailing,
  shrinkWrapContent = false,
  children,
}: RegularPageProps) {
  const growClass = shrinkWrapContent ? '' : 'flex-1';
  const accountDecorativeOverflow = topBarVariant === 'account';
  const contentClass = cn(
    'flex flex-col',
    growClass,
    accountDecorativeOverflow && 'overflow-visible',
    !noPadding && 'px-4 py-12 sm:px-8 sm:py-16',
    !noPadding && !header && !media && 'pt-20'
  );
  const columnClass = cn(
    'border-border flex flex-col border-r border-l',
    growClass,
    accountDecorativeOverflow && 'overflow-visible'
  );

  return (
    <div className="flex flex-1 flex-col">
      {showTopBar ? (
        <TopBar
          activePath={activePath}
          backLink={backLink}
          showLogo={showLogo}
          minimal={minimal}
          variant={topBarVariant}
        />
      ) : null}
      <main className={`border-border flex flex-col ${growClass}`}>
        <Container
          className={cn(
            'flex flex-col',
            growClass,
            accountDecorativeOverflow && 'overflow-visible'
          )}
        >
          <div className={columnClass}>
            {media}
            {header && (
              <>
                <div
                  className={[
                    'flex flex-col gap-6 px-4 pb-10 sm:px-8',
                    media ? 'pt-10' : 'pt-20',
                  ].join(' ')}
                >
                  {header}
                </div>
                <FullBleedDivider />
              </>
            )}
            <div className={contentClass}>{children}</div>
          </div>
          {trailing ? <FullBleedDivider /> : null}
        </Container>
        {trailing}
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
