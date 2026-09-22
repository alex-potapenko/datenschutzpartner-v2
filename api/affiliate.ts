import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { countLetters, PERSON_NAME_PATTERN } from '@/lib/validation/patterns';
import { normalizeAndValidateWebsiteUrl } from '@/lib/validation/url';
import { request } from './client';

/** Handle used in the individual affiliate link — letters, digits, dot, dash, underscore. */
export const AFFILIATE_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]$/i;

/**
 * Registration rules live here once. Pass a `next-intl` translator for the
 * `validation` namespace in forms; the API contract below reuses the same
 * rules with i18n keys as messages.
 */
export function createAffiliateRegistrationFormSchema(tv: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, tv('required')).regex(PERSON_NAME_PATTERN, tv('personName')),
    username: z
      .string()
      .trim()
      .min(1, tv('required'))
      .regex(AFFILIATE_USERNAME_PATTERN, tv('affiliateUsername')),
    email: z.email(tv('email')),
    paymentEmail: z.email(tv('email')),
    websiteUrl: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || normalizeAndValidateWebsiteUrl(value) !== null,
        tv('website')
      ),
    promotion: z
      .string()
      .trim()
      .min(10, tv('messageMin'))
      .max(5000, tv('messageMax'))
      .refine((value) => countLetters(value) >= 2, tv('message')),
    acceptTerms: z.boolean().refine((value) => value, { message: tv('terms') }),
  });
}

export const affiliateRegistrationCreateSchema = createAffiliateRegistrationFormSchema(
  (key) => `validation.${key}`
).omit({ acceptTerms: true });

export const affiliateRegistrationSchema = affiliateRegistrationCreateSchema.extend({
  id: z.string(),
  /** Applications are reviewed before the affiliate link is issued. */
  status: z.enum(['pending', 'approved']),
  createdAt: z.string(),
});

export type AffiliateRegistrationForm = z.infer<
  ReturnType<typeof createAffiliateRegistrationFormSchema>
>;
export type AffiliateRegistrationCreate = z.infer<typeof affiliateRegistrationCreateSchema>;
export type AffiliateRegistration = z.infer<typeof affiliateRegistrationSchema>;

export const affiliateKeys = {
  all: ['affiliate'] as const,
  registrations: () => [...affiliateKeys.all, 'registrations'] as const,
};

export function useCreateAffiliateRegistration() {
  return useMutation({
    mutationFn: (input: AffiliateRegistrationCreate) =>
      request<AffiliateRegistration>('/affiliate-registrations', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}
