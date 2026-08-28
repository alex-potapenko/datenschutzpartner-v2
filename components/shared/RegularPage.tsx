import { type ReactNode } from 'react';
import { TopBar } from '@/components/shared/TopBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

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
  topBarVariant?: 'default' | 'account';
  /** When false, the site footer is omitted (e.g. focused flows like questionnaires). */
  showFooter?: boolean;
  /**
   * When true the content area has no padding — useful when the page needs to render
   * full-bleed column layouts (e.g. a two-column contact layout with an inner border-r).
   */
  noPadding?: boolean;
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
  children,
}: RegularPageProps) {
  const contentClass = noPadding
    ? 'flex flex-1 flex-col'
    : `flex flex-1 flex-col px-4 py-12 sm:px-8 sm:py-16 ${!header && !media ? 'pt-20' : ''}`;

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
      <main className="border-border flex flex-1 flex-col border-b">
        <Container className="flex flex-1 flex-col">
          <div className="border-border flex flex-1 flex-col border-r border-l">
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
                <div
                  aria-hidden
                  className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
                />
              </>
            )}
            <div className={contentClass}>{children}</div>
          </div>
        </Container>
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
