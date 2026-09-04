import { z } from 'zod';
import { isKnownCountryName } from './countries';
import { isValidDomainHost } from './url';
import {
  CITY_NAME_PATTERN,
  COMPANY_NAME_PATTERN,
  countLetters,
  PERSON_NAME_PATTERN,
  POSTAL_CODE_PATTERN,
  STREET_ADDRESS_PATTERN,
  VAT_ID_PATTERN,
} from './patterns';

export const personNameField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(PERSON_NAME_PATTERN, 'validation.personName');

export const companyNameField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(COMPANY_NAME_PATTERN, 'validation.companyName');

export const streetAddressField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(STREET_ADDRESS_PATTERN, 'validation.street');

export const optionalStreetLine2Field = z
  .string()
  .trim()
  .refine((value) => value === '' || STREET_ADDRESS_PATTERN.test(value), 'validation.street');

export const postalCodeField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(POSTAL_CODE_PATTERN, 'validation.postalCode');

export const cityNameField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(CITY_NAME_PATTERN, 'validation.city');

export const countryNameField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .refine((value) => isKnownCountryName(value), 'validation.country');

export const domainField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .refine((value) => isValidDomainHost(value), 'validation.domain');

export const emailField = z.email('validation.email');

export const messageField = z
  .string()
  .trim()
  .min(10, 'validation.messageMin')
  .max(5000, 'validation.messageMax')
  .refine((value) => countLetters(value) >= 2, 'validation.message');

export const optionalCompanyField = z
  .string()
  .trim()
  .refine((value) => value === '' || COMPANY_NAME_PATTERN.test(value), 'validation.companyName');

export const optionalVatIdField = z
  .string()
  .trim()
  .refine((value) => value === '' || VAT_ID_PATTERN.test(value), 'validation.vatId');

export const euRepEntityFieldsSchema = z.object({
  legalEntity: companyNameField,
  forwardingEmail: emailField,
  postalLine1: streetAddressField,
  postalLine2: optionalStreetLine2Field,
  postalCode: postalCodeField,
  city: cityNameField,
  country: countryNameField,
});

export const euRepThirdPartyRepSchema = z.object({
  thirdPartyRepName: companyNameField,
  thirdPartyRepStreet: streetAddressField,
  thirdPartyRepPostalCode: postalCodeField,
  thirdPartyRepCity: cityNameField,
  thirdPartyRepCountry: countryNameField,
  thirdPartyRepEmail: emailField,
});

export type EuRepEntityFields = z.infer<typeof euRepEntityFieldsSchema>;
export type EuRepThirdPartyRepFields = z.infer<typeof euRepThirdPartyRepSchema>;

export function mapZodFieldErrors<T extends string>(
  error: z.ZodError,
  translate: (key: string) => string
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string' || key in errors) continue;
    const message = issue.message;
    errors[key as T] = message.startsWith('validation.')
      ? translate(message.slice('validation.'.length))
      : message;
  }

  return errors;
}
