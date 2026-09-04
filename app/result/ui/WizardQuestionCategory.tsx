import type { ReactNode } from 'react';

type WizardQuestionCategoryProps = {
  label: string;
  children: ReactNode;
};

/** Two-column questionnaire section — category label left, questions right. */
export function WizardQuestionCategory({ label, children }: WizardQuestionCategoryProps) {
  return (
    <div className="border-border grid grid-cols-1 border-b last:border-b-0 lg:grid-cols-2">
      <div className="border-border border-b p-4 sm:p-8 lg:border-r lg:border-b-0">
        <h2 className="text-muted text-lg leading-snug font-semibold">{label}</h2>
      </div>
      <div className="divide-border flex flex-col divide-y">{children}</div>
    </div>
  );
}
