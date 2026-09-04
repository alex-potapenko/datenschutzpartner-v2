import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import {
  emailField,
  messageField,
  optionalCompanyField,
  personNameField,
} from '@/lib/validation/fields';
import { request } from './client';

export const contactSubjectSchema = z.enum([
  'general-question',
  'privacy-policy-generator',
  'eu-representative',
  'academy',
]);

export const CONTACT_SUBJECTS = contactSubjectSchema.options;

export type ContactSubject = z.infer<typeof contactSubjectSchema>;

export function parseContactSubject(value: string | undefined): ContactSubject {
  const parsed = contactSubjectSchema.safeParse(value);
  return parsed.success ? parsed.data : 'general-question';
}

export type ContactSpamChallenge = {
  a: number;
  b: number;
  answer: number;
};

export function createContactSpamChallenge(): ContactSpamChallenge {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export const contactMessageSchema = z.object({
  id: z.string(),
  name: personNameField,
  company: optionalCompanyField,
  email: emailField,
  subject: contactSubjectSchema,
  message: messageField,
  createdAt: z.string(),
});

export const contactMessageCreateSchema = contactMessageSchema.omit({ id: true, createdAt: true });

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type ContactMessageCreate = z.infer<typeof contactMessageCreateSchema>;

export function useCreateContactMessage() {
  return useMutation({
    mutationFn: (input: ContactMessageCreate) =>
      request<ContactMessage>('/contact-messages', { method: 'POST', body: JSON.stringify(input) }),
  });
}
