import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

/**
 * Example domain module — copy this file as the starting point for every
 * new API domain. The zod schema is the source of truth for the type AND
 * the form validation; the MSW handlers in mocks/handlers.ts implement
 * the same contract.
 */
export const contactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'validation.required'),
  email: z.email('validation.email'),
  company: z.string().optional(),
});
export const contactCreateSchema = contactSchema.omit({ id: true });

export type Contact = z.infer<typeof contactSchema>;
export type ContactCreate = z.infer<typeof contactCreateSchema>;

export const contactKeys = {
  all: ['contacts'] as const,
  detail: (id: string) => ['contacts', id] as const,
};

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.all,
    queryFn: () => request<Contact[]>('/contacts'),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactCreate) =>
      request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<undefined>(`/contacts/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
}
