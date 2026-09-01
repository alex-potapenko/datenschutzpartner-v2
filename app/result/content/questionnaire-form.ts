export interface QuestionnaireFormData {
  companyName: string;
  domain: string;
  email: string;
  street: string;
  streetLine2: string;
  postalCode: string;
  city: string;
  country: string;
  hasDpo: string;
  dpoCompanyName: string;
  dpoDesignation: string;
  dpoStreet: string;
  dpoPostalCode: string;
  dpoCity: string;
  dpoCountry: string;
  dpoEmail: string;
  gdprApplicable: string;
  offersToEU: string;
  monitorsEUBehaviour: string;
  transfersAbroad: string;
  usesProfiling: string;
  processesSpecialData: string;
  specialDataCategories: string[];
  usesAiProcessing: string;
  acceptsApplications: string;
  hasTalentPool: string;
  usesVideoSurveillance: string;
  videoRetention: string;
  videoRetentionAmount: string;
  videoRetentionUnit: string;
  hasThirdPartyEuRep: string;
  thirdPartyRepName: string;
  thirdPartyRepStreet: string;
  thirdPartyRepPostalCode: string;
  thirdPartyRepCity: string;
  thirdPartyRepCountry: string;
  thirdPartyRepEmail: string;
  /** Swiss controller — defaults to yes for this product. */
  basedInSwitzerland: string;
}

export const SPECIAL_DATA_OPTIONS = [
  { value: 'health', label: 'Health data' },
  { value: 'religion', label: 'Religious / philosophical beliefs' },
  { value: 'politics', label: 'Political opinions' },
  { value: 'union', label: 'Trade union membership' },
  { value: 'genetic', label: 'Genetic data' },
  { value: 'biometric', label: 'Biometric data' },
  { value: 'sexuality', label: 'Data about sex life / sexual orientation' },
] as const;

export const TRANSFERS_ABROAD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'eea', label: 'Yes, to the European Economic Area (EEA)' },
  { value: 'worldwide', label: 'Yes, worldwide' },
] as const;

export const VIDEO_RETENTION_OPTIONS = [
  { value: 'none', label: 'No storage' },
  { value: 'duration', label: 'Fixed duration' },
  { value: 'asRequired', label: 'As long as required' },
] as const;

const OPTION_LABELS = Object.fromEntries(
  [...SPECIAL_DATA_OPTIONS, ...TRANSFERS_ABROAD_OPTIONS, ...VIDEO_RETENTION_OPTIONS].map(
    (option) => [option.value, option.label]
  )
) as Record<string, string>;

export function formatYesNo(value: string) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  return '—';
}

export function formatYesNoUnknown(value: string) {
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';
  if (value === 'dontknow') return 'Unknown';
  return '—';
}

export function formatOptionLabel(value: string) {
  return OPTION_LABELS[value] ?? value;
}

export function formatOptionLabels(values: string[]) {
  return values.map(formatOptionLabel).join(', ');
}

export {
  getVisibleEuRepQuestionFields,
  getGdprBranchVisibility,
  isGdprApplicable,
  showThirdPartyEuRepQuestion,
} from '@/api/generator';
