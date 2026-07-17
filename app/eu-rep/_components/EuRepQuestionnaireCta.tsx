'use client';

import { useRouter } from 'next/navigation';
import { Button, CaretRight } from '@/components/ui';

type EuRepQuestionnaireCtaProps = {
  label: string;
  returnTo?: string;
};

export function EuRepQuestionnaireCta({ label, returnTo }: EuRepQuestionnaireCtaProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="lg"
      className="font-display h-14 w-fit gap-2 rounded-full px-8 text-base"
      onPress={() => {
        const href = returnTo
          ? `/eu-rep/questionnaire?returnTo=${encodeURIComponent(returnTo)}`
          : '/eu-rep/questionnaire';
        router.push(href);
      }}
    >
      {label}
      <CaretRight size={16} weight="bold" aria-hidden />
    </Button>
  );
}
