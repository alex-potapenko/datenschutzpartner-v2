export {
  CITY_NAME_PATTERN,
  COMPANY_NAME_PATTERN,
  countLetters,
  DOMAIN_HOST_PATTERN,
  PERSON_NAME_PATTERN,
  POSTAL_CODE_PATTERN,
  STREET_ADDRESS_PATTERN,
  VAT_ID_PATTERN,
} from './patterns';
export { isKnownCountryName } from './countries';
export {
  emailField,
  companyNameField,
  cityNameField,
  countryNameField,
  domainField,
  euRepEntityFieldsSchema,
  euRepThirdPartyRepSchema,
  mapZodFieldErrors,
  messageField,
  optionalCompanyField,
  optionalStreetLine2Field,
  optionalVatIdField,
  personNameField,
  postalCodeField,
  streetAddressField,
  type EuRepEntityFields,
  type EuRepThirdPartyRepFields,
} from './fields';
export { extractDomainHost, isValidDomainHost, normalizeAndValidateWebsiteUrl } from './url';
