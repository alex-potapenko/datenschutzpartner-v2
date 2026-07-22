import { env } from '@/env';

/** POC-only: skip questionnaire validation so Continue always advances the wizard. */
export function isWizardValidationSkipped(): boolean {
  return env.NEXT_PUBLIC_WIZARD_SKIP_VALIDATION === 'enabled';
}
