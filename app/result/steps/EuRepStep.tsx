'use client';

import { useTranslations } from 'next-intl';
import {
  Button,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
} from '@/components/ui';
import { EuRepBenefitsPanel } from '@/app/eu-rep/_components/EuRepBenefitsPanel';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { getVisibleEuRepQuestionFields } from '@/api/generator';
import { StepHeader } from '../ui/StepHeader';
import { StepFooter } from '../ui/StepFooter';
import { Container } from '@/components/shared/Container';
import { AnswerPill } from '../ui/FormSection';
import type { ImprovedFormData } from '../content/improved-form';
import { isEuRepRequired, type EuRepPlanId, type EuRepState } from '../wizard-state';

interface EuRepStepProps {
  formData: ImprovedFormData;
  onComplete: (next: EuRepState) => void;
  onBack?: () => void;
}

const EU_REP_QUESTIONS = [
  { id: 'q1' as const, field: 'basedInSwitzerland' as const, withUnknown: false },
  { id: 'q2' as const, field: 'offersToEU' as const, withUnknown: true },
  { id: 'q3' as const, field: 'monitorsEUBehaviour' as const, withUnknown: true },
] as const;

function EuRepAnswersDialog({
  formData,
  state,
}: {
  formData: ImprovedFormData;
  state: ReturnType<typeof useOverlayState>;
}) {
  const t = useTranslations('result.euRepStep');
  const tEuRepQ = useTranslations('euRepQuestionnaire');
  const visible = getVisibleEuRepQuestionFields(formData);

  const visibleQuestions = EU_REP_QUESTIONS.filter(({ field }) => {
    switch (field) {
      case 'basedInSwitzerland':
        return true;
      case 'offersToEU':
        return visible.offersToEU;
      case 'monitorsEUBehaviour':
        return visible.monitorsEUBehaviour;
    }
  });

  function answerLabel(value: string, withUnknown: boolean) {
    if (value === 'yes') return tEuRepQ('yes');
    if (value === 'no') return tEuRepQ('no');
    if (withUnknown && value === 'dontknow') return tEuRepQ('dontknow');
    return '—';
  }

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('answersDialogTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <ul className="divide-border flex flex-col divide-y">
                {visibleQuestions.map(({ id, field, withUnknown }) => (
                  <li key={id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                    <p className="text-foreground text-sm font-semibold">
                      {tEuRepQ(`questions.${id}.title`)}
                    </p>
                    <AnswerPill label={answerLabel(formData[field], withUnknown)} />
                  </li>
                ))}
              </ul>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onPress={() => {
                  state.close();
                }}
              >
                {t('answersDialogDone')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

export function EuRepStep({ formData, onComplete, onBack }: EuRepStepProps) {
  const t = useTranslations('result.euRepStep');
  const required = isEuRepRequired(formData);
  const answersDialog = useOverlayState();
  const skipConfirm = useOverlayState();

  function choosePlan(plan: EuRepPlanId) {
    onComplete({ plan, declined: false, done: true });
  }

  function skip() {
    onComplete({ plan: undefined, declined: true, done: true });
  }

  function handleSkipPress() {
    if (required) {
      skipConfirm.open();
      return;
    }
    skip();
  }

  const description = required ? (
    <>
      <p>
        {t.rich('requiredIntro', {
          answers: (chunks) => (
            <NavigationLink
              onPress={() => {
                answersDialog.open();
              }}
              chevron="none"
              className="font-semibold"
            >
              {chunks}
            </NavigationLink>
          ),
        })}
      </p>
      <p className="text-muted text-sm">{t('requiredDisclaimer')}</p>
    </>
  ) : (
    <p>
      {t.rich('optionalIntro', {
        answers: (chunks) => (
          <NavigationLink
            onPress={() => {
              answersDialog.open();
            }}
            chevron="none"
            className="font-semibold"
          >
            {chunks}
          </NavigationLink>
        ),
      })}
    </p>
  );

  return (
    <>
      <StepHeader title={t('title')} description={description} />

      <Container>
        <div className="border-border flex flex-col border-r border-l">
          <EuRepBenefitsPanel
            showBottomBorder={false}
            onChoose={choosePlan}
            chooseLabels={{
              budget: t('chooseBudget'),
              standard: t('chooseStandard'),
              premium: t('choosePremium'),
            }}
          />
        </div>
      </Container>

      <StepFooter onBack={onBack} onSkip={handleSkipPress} skipLabel={t('skip')} />

      <EuRepAnswersDialog formData={formData} state={answersDialog} />

      <ModalRoot state={skipConfirm}>
        <ModalBackdrop isDismissable>
          <ModalContainer size="sm">
            <ModalDialog>
              <ModalHeader>
                <ModalHeading>{t('skipConfirmTitle')}</ModalHeading>
              </ModalHeader>
              <ModalBody>
                <p className="text-muted text-sm">{t('skipConfirmBody')}</p>
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
                  className="text-danger"
                  onPress={() => {
                    skipConfirm.close();
                    skip();
                  }}
                >
                  {t('skipConfirmProceed')}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </ModalRoot>
    </>
  );
}
