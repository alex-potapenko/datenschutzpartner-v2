'use client';

import { useTranslations } from 'next-intl';
import { EU_REP_REPRESENTATIVE, formatEuRepRepresentativeAddressForClipboard } from '@/api/eu-rep';
import { CopyClipboardButton } from '@/components/shared/CopyClipboardButton';
import { navigationLinkClassName } from '@/components/shared/NavigationLink';

/** Public Art. 27 address shown at purchase — never includes the forwarding email. */
export function EuRepRepresentativeAddress({
  hideTitle = false,
  plain = false,
  linkify = true,
  linkifyCompany,
  linkifyEmail,
  showCopyButton = false,
}: {
  hideTitle?: boolean;
  plain?: boolean;
  /** When false, company name and email render as plain text (e.g. wizard “already covered”). */
  linkify?: boolean;
  linkifyCompany?: boolean;
  linkifyEmail?: boolean;
  showCopyButton?: boolean;
}) {
  const t = useTranslations('euRepRepresentative');
  const representative = EU_REP_REPRESENTATIVE;
  const linkClassName = navigationLinkClassName('default');
  const showCompanyLink = linkifyCompany ?? linkify;
  const showEmailLink = linkifyEmail ?? linkify;
  const countryLabel = t('country');
  const clipboardText = formatEuRepRepresentativeAddressForClipboard(countryLabel);

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
        {showCompanyLink ? (
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
        {showEmailLink ? (
          <a href={`mailto:${representative.email}`} className={linkClassName}>
            {representative.email}
          </a>
        ) : (
          representative.email
        )}
      </p>
      {showCopyButton ? (
        <CopyClipboardButton
          copyLabel={t('copyToClipboard')}
          copyErrorMessage={t('copyFailed')}
          onCopy={async () => {
            await navigator.clipboard.writeText(clipboardText);
          }}
        />
      ) : null}
    </div>
  );
}
