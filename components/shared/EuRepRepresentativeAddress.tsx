'use client';

import { useTranslations } from 'next-intl';
import { EU_REP_REPRESENTATIVE } from '@/api/eu-rep';
import { navigationLinkClassName } from '@/components/shared/NavigationLink';

/** Public Art. 27 address shown at purchase — never includes the forwarding email. */
export function EuRepRepresentativeAddress({
  hideTitle = false,
  plain = false,
  linkify = true,
}: {
  hideTitle?: boolean;
  plain?: boolean;
  /** When false, company name and email render as plain text (e.g. wizard “already covered”). */
  linkify?: boolean;
}) {
  const t = useTranslations('euRepRepresentative');
  const representative = EU_REP_REPRESENTATIVE;
  const linkClassName = navigationLinkClassName('default');

  return (
    <div
      className={
        plain
          ? 'flex flex-col gap-2'
          : 'border-border bg-background flex flex-col gap-2 rounded-xl border p-4'
      }
    >
      {hideTitle ? null : (
        <p className="text-foreground text-sm font-semibold">{t('previewTitle')}</p>
      )}
      <p className="text-foreground text-base leading-relaxed">
        {linkify ? (
          <a
            href={representative.website}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {representative.name}
          </a>
        ) : (
          representative.name
        )}
        <br />
        {representative.street}
        <br />
        {representative.postalCode} {representative.city}
        <br />
        {t('country')}
        <br />
        {linkify ? (
          <a href={`mailto:${representative.email}`} className={linkClassName}>
            {representative.email}
          </a>
        ) : (
          representative.email
        )}
      </p>
    </div>
  );
}
