'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { GeneratedDocument } from '@/api/documents';
import { useStartPolicyTrial } from '@/api/checkout';
import { Button, CaretRight, CheckCircle, Spinner } from '@/components/ui';
import { Container } from '@/components/shared/Container';
import { buildTrialCheckoutPayload } from '../trial-payload';
import type { QuestionnaireFormData } from '../content/questionnaire-form';
import type { EuRepState } from '../wizard-state';
import { StepFrame } from '../ui/StepFrame';

interface PolicyReadyScreenProps {
  domain: string;
  formData?: QuestionnaireFormData;
  euRep: EuRepState;
  fillSubscriptionId?: string;
  document?: GeneratedDocument;
  onShowPolicy: (document: GeneratedDocument) => void;
}

function fallbackPolicy(domain: string, id: string): GeneratedDocument {
  const today = new Date().toISOString().slice(0, 10);
  const year = Number(today.slice(0, 4));
  return {
    id,
    name: 'Privacy Policy',
    site: domain,
    createdDate: today,
    updatedDate: today,
    versions: [{ year, current: true, effectiveDate: today, changeSummary: 'initial' }],
  };
}

export function PolicyReadyScreen({
  domain,
  formData,
  euRep,
  fillSubscriptionId,
  document,
  onShowPolicy,
}: PolicyReadyScreenProps) {
  const t = useTranslations('result.policyReady');
  const startTrial = useStartPolicyTrial();

  async function handleShowPolicy() {
    if (document) {
      onShowPolicy(document);
      return;
    }

    if (!formData) {
      toast.error(t('failed'));
      return;
    }

    try {
      const result = await startTrial.mutateAsync(
        buildTrialCheckoutPayload(domain, formData, euRep, fillSubscriptionId)
      );
      const next =
        result.document ??
        (result.documentId ? fallbackPolicy(domain, result.documentId) : undefined);
      if (!next) {
        toast.error(t('failed'));
        return;
      }
      onShowPolicy(next);
    } catch {
      toast.error(t('failed'));
    }
  }

  return (
    <StepFrame centerContent>
      <Container className="flex h-full flex-1 flex-col overflow-visible">
        <div className="border-border flex h-full flex-1 flex-col overflow-visible border-r border-l">
          <div className="flex h-full flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
            <div className="flex w-full max-w-lg flex-col items-center gap-8">
              <CheckCircle size={48} weight="fill" className="text-accent" aria-hidden />
              <div className="flex flex-col gap-3">
                <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{t('title')}</h1>
                <p className="text-foreground text-base leading-relaxed">{t('body')}</p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="font-display h-14 gap-2 rounded-full px-8 text-base"
                onPress={() => void handleShowPolicy()}
                isDisabled={startTrial.isPending}
              >
                {startTrial.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" aria-hidden />
                    {t('loading')}
                  </span>
                ) : (
                  <>
                    {t('showPolicy')}
                    <CaretRight size={16} weight="bold" aria-hidden />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </StepFrame>
  );
}
