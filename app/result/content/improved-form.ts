export interface ImprovedFormData {
  companyName: string;
  domain: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  generatesRevenue: string;
  revenueTypes: string[];
  processesSpecialData: string;
  specialDataCategories: string[];
  basedInSwitzerland: string;
  processesEUData: string;
  systematically: string;
  offersToEU: string;
  monitorsEUBehaviour: string;
  hasEUEstablishment: string;
  transfersToThirdCountry: string;
  usesDataForMarketing: string;
  usesProfiling: string;
  hasEmployeePrivacyNotice: string;
  employeePrivacyUrl: string;
  listSupervisoryAuthority: string;
  supervisoryAuthority: string;
}

export const REVENUE_TYPE_OPTIONS = [
  { value: 'memberships', label: 'Memberships / subscriptions' },
  { value: 'products', label: 'Sale of products / services' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'other', label: 'Other' },
] as const;

export const SPECIAL_DATA_OPTIONS = [
  { value: 'health', label: 'Health data' },
  { value: 'religion', label: 'Religious / philosophical beliefs' },
  { value: 'politics', label: 'Political opinions' },
  { value: 'union', label: 'Trade union membership' },
  { value: 'genetic', label: 'Genetic data' },
  { value: 'biometric', label: 'Biometric data' },
  { value: 'sexuality', label: 'Data about sex life / sexual orientation' },
] as const;

export const SUPERVISORY_AUTHORITY_OPTIONS = [
  { value: 'edob', label: 'EDÖB (Switzerland)' },
  { value: 'bfdi', label: 'BfDI (Germany)' },
  { value: 'dsb', label: 'DSB (Austria)' },
  { value: 'other', label: 'Other' },
] as const;

const OPTION_LABELS = Object.fromEntries(
  [...REVENUE_TYPE_OPTIONS, ...SPECIAL_DATA_OPTIONS, ...SUPERVISORY_AUTHORITY_OPTIONS].map(
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

export { getVisibleEuRepQuestionFields } from '@/api/generator';

export const EU_REP_PLANS = {
  budget: {
    name: 'Budget',
    price: 'CHF 149.00',
    inquiry: 'CHF 99.00 per inquiry',
  },
  standard: {
    name: 'Standard',
    price: 'CHF 249.00',
    inquiry: '1 inquiry / year included',
  },
  premium: {
    name: 'Premium',
    price: 'CHF 499.00',
    inquiry: '5 inquiries / year included',
  },
} as const;
