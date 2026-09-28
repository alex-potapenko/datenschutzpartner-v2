'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { TwoFactorSetup } from '@/api/two-factor';
import { formatTotpSecret } from '@/lib/totp';
import { Button, Check, Copy, InputGroup, Spinner } from '@/components/ui';
import { TotpInput } from '@/components/shared/TotpInput';
import { QrCode } from './QrCode';
import { FieldErrorText } from '@/components/shared/FieldErrorText';

function SetupStepIntro({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span
        className="bg-foreground text-background flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
        aria-hidden
      >
        {step}
      </span>
      <p className="text-foreground min-w-0 flex-1 pt-0.5 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * Step one of enabling 2FA: scan the QR code (or type the secret by hand) and
 * confirm with the first generated code. Shared by the account settings dialog
 * and the e-mail setup link, so it owns no navigation of its own.
 */
export function TwoFactorSetupPanel({
  setup,
  isVerifying,
  isInvalid,
  onSubmit,
  code: controlledCode,
  onCodeChange,
  showSubmitButton = true,
}: {
  setup: TwoFactorSetup | undefined;
  isVerifying: boolean;
  isInvalid: boolean;
  onSubmit: (code: string) => void;
  code?: string;
  onCodeChange?: (code: string) => void;
  showSubmitButton?: boolean;
}) {
  const t = useTranslations('twoFactor');
  const [internalCode, setInternalCode] = useState('');
  const code = controlledCode ?? internalCode;
  const setCode = onCodeChange ?? setInternalCode;
  const [copied, setCopied] = useState(false);

  if (!setup) {
    return (
      <div className="flex justify-center py-10">
        <Spinner aria-label={t('setupLoading')} />
      </div>
    );
  }

  async function copySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(t('secretCopyFailed'));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupStepIntro step={1}>{t('setupScanBody')}</SetupStepIntro>

      <div className="flex flex-col items-center gap-4">
        <div className="border-border rounded-xl border bg-white p-3">
          <QrCode value={setup.otpauthUri} label={t('qrAlt')} size={192} className="text-black" />
        </div>

        <div className="flex w-full flex-col gap-2">
          <p className="text-foreground text-start text-sm leading-relaxed">{t('secretHint')}</p>
          <InputGroup variant="secondary" fullWidth>
            <InputGroup.Input
              readOnly
              value={formatTotpSecret(setup.secret)}
              aria-label={t('secretHint')}
              className="cursor-default font-mono text-xs sm:text-sm"
            />
            <InputGroup.Suffix className="pe-1">
              <Button
                variant="outline"
                size="sm"
                isIconOnly
                aria-label={t('secretCopy')}
                onPress={() => {
                  void copySecret(setup.secret);
                }}
              >
                {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SetupStepIntro step={2}>{t('setupVerifyBody')}</SetupStepIntro>
        <TotpInput
          aria-label={t('codeLabel')}
          value={code}
          isInvalid={isInvalid}
          isDisabled={isVerifying}
          onChange={setCode}
        />
        <FieldErrorText message={isInvalid ? t('codeInvalid') : undefined} />
      </div>

      {showSubmitButton ? (
        <Button
          variant="primary"
          fullWidth
          isDisabled={code.length !== 6 || isVerifying}
          onPress={() => {
            onSubmit(code);
          }}
        >
          {t('activateCta')}
        </Button>
      ) : null}
    </div>
  );
}
