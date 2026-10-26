'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { formatRecoveryCodesForDownload } from '@/lib/recovery-codes';
import {
  Button,
  Check,
  Checkbox,
  CheckboxControl,
  CheckboxContent,
  CheckboxIndicator,
  Copy,
  DownloadSimple,
} from '@/components/ui';

/**
 * Recovery codes are shown exactly once, so the confirmation checkbox is the
 * guard against closing the dialog before they have been stored somewhere.
 */
export function RecoveryCodesPanel({
  codes,
  accountName,
  onConfirm,
  confirmLabel,
}: {
  codes: string[];
  accountName: string;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  const t = useTranslations('twoFactor');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(t('secretCopyFailed'));
    }
  }

  function downloadCodes() {
    const blob = new Blob([formatRecoveryCodesForDownload(codes, accountName)], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'datenschutzpartner-recovery-codes.txt';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-foreground text-sm leading-relaxed">{t('recoveryBody')}</p>

      <ul className="border-border grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border px-4 py-4">
        {codes.map((code) => (
          <li key={code} className="text-foreground font-mono text-sm tracking-wide">
            {code}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="normal-case"
          onPress={() => {
            void copyCodes();
          }}
        >
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
          {t('recoveryCopy')}
        </Button>
        <Button variant="outline" size="sm" className="normal-case" onPress={downloadCodes}>
          <DownloadSimple size={16} />
          {t('recoveryDownload')}
        </Button>
      </div>

      <Checkbox isSelected={saved} onChange={setSaved}>
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        <CheckboxContent>
          <span className="text-foreground text-sm leading-relaxed">{t('recoveryConfirm')}</span>
        </CheckboxContent>
      </Checkbox>

      <Button variant="primary" fullWidth isDisabled={!saved} onPress={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
}
