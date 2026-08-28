'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  Spinner,
  useOverlayState,
} from '@/components/ui';
import { findEuRepContractForLegalEntity, useEuRepContracts } from '@/api/eu-rep';
import { EuRepWizardAlreadyCovered } from '../components/EuRepWizardAlreadyCovered';
import { EuRepWizardOffer } from '../components/EuRepWizardOffer';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { StepFrame } from '../ui/StepFrame';
import { Container } from '@/components/shared/Container';
import type { ImprovedFormData } from '../content/improved-form';
import { isEuRepRequired, type EuRepState } from '../wizard-state';

interface EuRepStepProps {
  formData: ImprovedFormData;
  onComplete: (next: EuRepState) => void;
  onBack?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EuRepStep({ formData, onComplete, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const tAccount = useTranslations('account');
  const required = isEuRepRequired(formData);
  const skipConfirm = useOverlayState();
  const contracts = useEuRepContracts();
  const existing = (contracts.data ?? []).filter((row) => row.status === 'active');
  const matchedContract = findEuRepContractForLegalEntity(existing, formData.companyName);

  const [legalEntity, setLegalEntity] = useState(formData.companyName);
  const [forwardingEmail, setForwardingEmail] = useState(formData.email);
  const [legalEntityError, setLegalEntityError] = useState<string>();
  const [forwardingEmailError, setForwardingEmailError] = useState<string>();

  function validateNewEntity(): boolean {
    const entityOk = legalEntity.trim().length > 0;
    const emailOk = EMAIL_PATTERN.test(forwardingEmail.trim());
    setLegalEntityError(entityOk ? undefined : tValidation('required'));
    setForwardingEmailError(emailOk ? undefined : tValidation('email'));
    return entityOk && emailOk;
  }

  function completeSkipped() {
    onComplete({ declined: true, done: true });
  }

  function handleSkip() {
    if (required) {
      skipConfirm.open();
      return;
    }
    completeSkipped();
  }

  function handleContinue() {
    if (matchedContract) {
      onComplete({
        linkContractId: matchedContract.id,
        declined: false,
        done: true,
      });
      return;
    }

    if (!validateNewEntity()) return;
    onComplete({
      plan: 'standard',
      linkContractId: undefined,
      legalEntity: legalEntity.trim(),
      forwardingEmail: forwardingEmail.trim(),
      declined: false,
      done: true,
    });
  }

  if (contracts.isLoading) {
    return (
      <StepFrame
        header={
          <StepHeader
            title={t('title')}
            description={required ? t('requiredIntroPlain') : t('optionalIntroPlain')}
          />
        }
        centerContent
      >
        <Container>
          <div className="border-border flex min-h-32 items-center justify-center border-r border-l py-10">
            <Spinner aria-label={tAccount('loading')} />
          </div>
        </Container>
      </StepFrame>
    );
  }

  if (matchedContract) {
    return (
      <StepFrame
        header={<StepHeader title={t('title')} />}
        footer={
          <StepFooter onBack={onBack} onContinue={handleContinue} ctaLabel={tCommon('continue')} />
        }
      >
        <Container className="flex h-full flex-1 flex-col overflow-visible">
          <div className="border-border flex h-full flex-1 flex-col overflow-visible border-r border-l">
            <EuRepWizardAlreadyCovered contract={matchedContract} />
          </div>
        </Container>
      </StepFrame>
    );
  }

  const description = required ? (
    <>
      <p>{t('requiredIntroPlain')}</p>
      <p className="text-muted text-sm">{t('requiredDisclaimer')}</p>
    </>
  ) : (
    <p>{t('optionalIntroPlain')}</p>
  );

  return (
    <StepFrame
      header={<StepHeader title={t('title')} description={description} />}
      footer={
        <StepFooter
          onBack={onBack}
          onSkip={handleSkip}
          skipLabel={t('skip')}
          onContinue={handleContinue}
          ctaLabel={tCommon('continue')}
        />
      }
    >
      <Container className="flex h-full flex-1 flex-col">
        <div className="border-border flex h-full flex-1 flex-col border-r border-l">
          <EuRepWizardOffer
            legalEntity={legalEntity}
            forwardingEmail={forwardingEmail}
            onLegalEntityChange={setLegalEntity}
            onForwardingEmailChange={setForwardingEmail}
            legalEntityError={legalEntityError}
            forwardingEmailError={forwardingEmailError}
          />
        </div>
      </Container>

      <ModalRoot state={skipConfirm}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{t('skipConfirmTitle')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-foreground text-sm leading-relaxed">{t('skipConfirmBody')}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  onPress={() => {
                    skipConfirm.close();
                  }}
                >
                  {t('skipConfirmCancel')}
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    skipConfirm.close();
                    completeSkipped();
                  }}
                >
                  {t('skipConfirmProceed')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </StepFrame>
  );
}
