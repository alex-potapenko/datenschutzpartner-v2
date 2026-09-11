'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useRequireSession } from '@/api/auth';
import { formatSiteDomain, useDocument } from '@/api/documents';
import { ApiError } from '@/api/client';
import { useRunManualScan } from '@/api/policy-updates';
import { EuRepWizardCoveredSection } from '@/app/result/components/EuRepWizardCoveredSection';
import { ScanStep } from '@/app/result/steps/ScanStep';
import { StepFrame } from '@/app/result/ui/StepFrame';
import { StepFooter } from '@/app/result/ui/StepFooter';
import { StepLayout } from '@/app/result/ui/StepLayout';
import { WizardBorderedColumn } from '@/app/result/ui/WizardBorderedColumn';
import { Container } from '@/components/shared/Container';
import { Button, Spinner } from '@/components/ui';
import {
  policyManualScanHref,
  privacyPolicyAccountHref,
  safeAccountReturnTo,
} from '@/lib/account-routes';

type ScanPhase = 'loading' | 'scanning' | 'unchanged' | 'error';

const STEP_TRANSITION = { duration: 0.18, ease: 'easeOut' as const };

export function PolicyManualScanApp() {
  const t = useTranslations('account.policyUpdates.manual');
  const tAccount = useTranslations('account');
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();

  const documentId = searchParams.get('document') ?? '';
  const { isChecking } = useRequireSession(policyManualScanHref(documentId));

  const document = useDocument(documentId);
  const { mutate: runManualScan } = useRunManualScan(documentId);

  const [phase, setPhase] = useState<ScanPhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scanStartedRef = useRef(false);
  const scanRequestedRef = useRef(false);

  const site = document.data?.site;
  const domain = site ? formatSiteDomain(site) : '';
  const backHref =
    safeAccountReturnTo(searchParams.get('returnTo')) ??
    privacyPolicyAccountHref({ site, tab: 'details' });

  const finishWizard = useCallback(() => {
    router.push(backHref);
  }, [backHref, router]);

  const handleAnimationComplete = useCallback(() => {
    if (!documentId || scanRequestedRef.current) return;

    scanRequestedRef.current = true;

    runManualScan(undefined, {
      onSuccess: (result) => {
        if (result.changesFound) {
          toast.success(t('success'));
          finishWizard();
          return;
        }

        setPhase('unchanged');
      },
      onError: (error) => {
        const message =
          error instanceof ApiError && error.status === 429 ? t('exhausted') : t('error');
        setErrorMessage(message);
        setPhase('error');
        toast.error(message);
      },
    });
  }, [documentId, finishWizard, runManualScan, t]);

  useEffect(() => {
    if (isChecking || document.isLoading || !documentId || !site || scanStartedRef.current) return;

    scanStartedRef.current = true;
    setPhase('scanning');
  }, [document.isLoading, documentId, isChecking, site]);

  const isError = phase === 'error';

  const doneFooter = (
    <StepFooter onContinue={finishWizard} ctaLabel={t('done')} showCtaCaret={false} />
  );

  return (
    <StepLayout
      step="scanning"
      domain={domain}
      hideDomain={!domain}
      quitHref={backHref}
      showStepBar={false}
    >
      {phase === 'loading' || (document.isLoading && !site) ? (
        <div className="flex min-h-60 flex-1 items-center justify-center py-20">
          <Spinner aria-label={tAccount('loading')} />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {phase === 'scanning' && domain ? (
          <motion.div
            key="scanning"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={STEP_TRANSITION}
          >
            <ScanStep domain={domain} onContinue={handleAnimationComplete} />
          </motion.div>
        ) : null}

        {phase === 'unchanged' ? (
          <motion.div
            key="unchanged"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={STEP_TRANSITION}
          >
            <StepFrame scrollWithContent>
              <Container className="flex min-h-full flex-1 flex-col">
                <WizardBorderedColumn className="divide-border divide-y" layoutKey="unchanged">
                  <EuRepWizardCoveredSection
                    variant="page"
                    title={t('noChangesTitle')}
                    body={t('noChangesBody')}
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="h-11 rounded-full px-8 sm:h-14 sm:px-10"
                      onPress={finishWizard}
                    >
                      {t('done')}
                    </Button>
                  </EuRepWizardCoveredSection>
                </WizardBorderedColumn>
              </Container>
            </StepFrame>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isError ? (
        <StepFrame scrollWithContent footer={doneFooter}>
          <Container className="flex min-h-full flex-1 flex-col">
            <WizardBorderedColumn layoutKey="error">
              <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
                <p className="text-foreground max-w-lg text-center text-base leading-relaxed">
                  {errorMessage ?? t('error')}
                </p>
              </div>
            </WizardBorderedColumn>
          </Container>
        </StepFrame>
      ) : null}

      {!site && !document.isLoading && !isChecking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-20 text-center">
          <p className="text-foreground text-base font-semibold">{t('notFound')}</p>
        </div>
      ) : null}
    </StepLayout>
  );
}
