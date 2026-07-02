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
  backLink?: { href: string; label: string };
  /** When false, the logo is hidden in the TopBar (e.g. on insight article pages). */
  showLogo?: boolean;
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
  noPadding = false,
  children,
}: RegularPageProps) {
  const contentClass = noPadding
    ? ''
    : `px-4 py-12 sm:px-8 sm:py-16 ${!header && !media ? 'pt-20' : ''}`;

  return (
    <>
      <TopBar activePath={activePath} backLink={backLink} showLogo={showLogo} />
      <main className="border-border border-b">
        <Container>
          <div className="border-border border-r border-l">
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
            {noPadding ? children : <div className={contentClass}>{children}</div>}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
