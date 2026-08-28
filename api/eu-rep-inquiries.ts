import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';

export const euRepInquiryStatusEnum = z.enum(['forwarded', 'answered', 'closed']);
export type EuRepInquiryStatus = z.infer<typeof euRepInquiryStatusEnum>;

export const euRepInquirySchema = z.object({
  id: z.string(),
  date: z.string(),
  subject: z.string(),
  status: euRepInquiryStatusEnum,
  reference: z.string().optional(),
});

export type EuRepInquiry = z.infer<typeof euRepInquirySchema>;

export const euRepInquiryKeys = {
  all: ['eu-rep-inquiries'] as const,
};

export function useEuRepInquiries() {
  return useQuery({
    queryKey: euRepInquiryKeys.all,
    queryFn: () => request<EuRepInquiry[]>('/eu-rep/inquiries'),
  });
}
