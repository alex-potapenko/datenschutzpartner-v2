'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Button, CaretRight, CheckCircle, Info, Warning } from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { RadioGroup } from '@/app/result/ui/FormSection';
import { QuestionnaireNewsletter } from './QuestionnaireNewsletter';
import { cn } from '@/lib/utils';

type QuestionId = 'q1' | 'q2' | 'q3';
type OutcomeId = 'eeaResident' | 'repRequired' | 'repNotRequired';

const OFFER_HREF = '/eu-rep#what-you-get';

const OUTCOME_STYLES: Record<OutcomeId, { card: string; heading: string; icon: ReactNode }> = {
  repRequired: {
    card: 'border-yellow-500 bg-yellow-50',
    heading: 'text-yellow-600',
    icon: <Warning size={22} weight="fill" aria-hidden />,
  },
  eeaResident: {
    card: 'border-green-500 bg-green-50',
    heading: 'text-green-600',
    icon: <CheckCircle size={22} weight="fill" aria-hidden />,
  },
  repNotRequired: {
    card: 'border-purple-500 bg-purple-50',
    heading: 'text-purple-600',
    icon: <Info size={22} weight="fill" aria-hidden />,
  },
};

const revealTransition = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const };

function getVisibleQuestions(answers: Partial<Record<QuestionId, 'yes' | 'no'>>): QuestionId[] {
  if (!answers.q1) {
    return ['q1'];
  }
  if (answers.q1 === 'no') {
    return ['q1'];
  }
  if (!answers.q2) {
    return ['q1', 'q2'];
  }
  if (answers.q2 === 'yes') {
    return ['q1', 'q2'];
  }
  return ['q1', 'q2', 'q3'];
}

function getOutcome(answers: Partial<Record<QuestionId, 'yes' | 'no'>>): OutcomeId | null {
  if (answers.q1 === 'no') {
    return 'eeaResident';
  }
  if (answers.q1 === 'yes' && answers.q2 === 'yes') {
    return 'repRequired';
  }
  if (answers.q1 === 'yes' && answers.q2 === 'no' && answers.q3) {
    return answers.q3 === 'yes' ? 'repRequired' : 'repNotRequired';
  }
  return null;
}

function getOutcomeQuestionId(
  answers: Partial<Record<QuestionId, 'yes' | 'no'>>
): QuestionId | null {
  if (answers.q1 === 'no') {
    return 'q1';
  }
  if (answers.q1 === 'yes' && answers.q2 === 'yes') {
    return 'q2';
  }
  if (answers.q1 === 'yes' && answers.q2 === 'no' && answers.q3) {
    return 'q3';
  }
  return null;
}

function updateAnswer(
  answers: Partial<Record<QuestionId, 'yes' | 'no'>>,
  questionId: QuestionId,
  value: 'yes' | 'no'
): Partial<Record<QuestionId, 'yes' | 'no'>> {
  if (questionId === 'q1') {
    return { q1: value };
  }
  if (questionId === 'q2') {
    return { q1: answers.q1, q2: value };
  }
  return { q1: answers.q1, q2: answers.q2, q3: value };
}

function QuestionBlock({
  questionId,
  answer,
  showBottomPadding,
  onAnswer,
  t,
}: {
  questionId: QuestionId;
  answer?: 'yes' | 'no';
  showBottomPadding: boolean;
  onAnswer: (questionId: QuestionId, value: 'yes' | 'no') => void;
  t: ReturnType<typeof useTranslations<'euRepQuestionnaire'>>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground !font-sans text-base font-semibold">
          {t(`questions.${questionId}.title`)}
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          {t(`questions.${questionId}.description`)}
        </p>
      </div>

      <div className={showBottomPadding ? 'pb-6' : undefined}>
        <RadioGroup
          name={questionId}
          options={[
            { value: 'yes', label: t('yes') },
            { value: 'no', label: t('no') },
          ]}
          value={answer ?? ''}
          onChange={(value) => {
            onAnswer(questionId, value as 'yes' | 'no');
          }}
        />
      </div>
    </div>
  );
}

function OutcomeCard({
  outcome,
  showOffer,
  showDisclaimer,
  showNewsletter,
  t,
  router,
}: {
  outcome: OutcomeId;
  showOffer: boolean;
  showDisclaimer: boolean;
  showNewsletter: boolean;
  t: ReturnType<typeof useTranslations<'euRepQuestionnaire'>>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border-2 p-4 sm:p-6',
        OUTCOME_STYLES[outcome].card
      )}
    >
      <h2
        className={cn(
          'font-display flex items-center gap-2 text-base font-semibold',
          OUTCOME_STYLES[outcome].heading
        )}
      >
        {OUTCOME_STYLES[outcome].icon}
        {t(`outcomes.${outcome}.heading`)}
      </h2>

      <p className="text-foreground text-base leading-relaxed">{t(`outcomes.${outcome}.body`)}</p>

      {showOffer ? (
        <Button
          variant="primary"
          size="lg"
          className="w-fit gap-2"
          onPress={() => {
            router.push(OFFER_HREF);
          }}
        >
          {t(`outcomes.${outcome}.offerLink`)}
          <CaretRight size={16} weight="bold" aria-hidden />
        </Button>
      ) : null}

      {outcome === 'repNotRequired' ? (
        <p className="text-foreground text-base leading-relaxed">
          {t('outcomes.repNotRequired.advisory')}{' '}
          <NavigationLink
            href="/contact?subject=eu-representative"
            chevron="none"
            className="font-medium"
          >
            {t('contactCta')}
          </NavigationLink>
        </p>
      ) : null}

      {showDisclaimer ? (
        <p className="text-foreground text-sm leading-relaxed">
          {t('outcomes.repRequired.disclaimer')}
        </p>
      ) : null}

      {showNewsletter ? (
        <div className="border-border flex flex-col gap-4 border-t pt-4">
          <p className="text-foreground text-base leading-relaxed">
            {t('outcomes.newsletterLead')}
          </p>
          <QuestionnaireNewsletter />
        </div>
      ) : null}
    </div>
  );
}

export function EuRepQuestionnaireFlow() {
  const t = useTranslations('euRepQuestionnaire');
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, 'yes' | 'no'>>>({});

  const visibleQuestions = getVisibleQuestions(answers);
  const outcome = getOutcome(answers);
  const outcomeQuestionId = getOutcomeQuestionId(answers);

  function handleAnswer(questionId: QuestionId, value: 'yes' | 'no') {
    setAnswers((prev) => updateAnswer(prev, questionId, value));
  }

  const showNewsletter = outcome === 'eeaResident' || outcome === 'repNotRequired';
  const showDisclaimer = outcome === 'repRequired';
  const showOffer = outcome === 'repRequired' || outcome === 'repNotRequired';

  const motionTransition = {
    ...revealTransition,
    duration: reduceMotion ? 0 : revealTransition.duration,
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col">
        {visibleQuestions.map((questionId, index) => {
          const outcomeHere = questionId === outcomeQuestionId ? outcome : null;

          return (
            <motion.div
              key={questionId}
              initial={index === 0 || reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionTransition}
              className={cn(index > 0 && 'border-border border-t pt-8', 'flex flex-col gap-8')}
            >
              <QuestionBlock
                questionId={questionId}
                answer={answers[questionId]}
                showBottomPadding={outcomeHere === null}
                onAnswer={handleAnswer}
                t={t}
              />

              {outcomeHere !== null ? (
                <motion.div
                  key={outcomeHere}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={motionTransition}
                >
                  <OutcomeCard
                    outcome={outcomeHere}
                    showOffer={showOffer}
                    showDisclaimer={showDisclaimer}
                    showNewsletter={showNewsletter}
                    t={t}
                    router={router}
                  />
                </motion.div>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
