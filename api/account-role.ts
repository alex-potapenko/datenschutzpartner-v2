import { z } from 'zod';

export const accountRoleSchema = z.enum(['member', 'admin']);
export type AccountRole = z.infer<typeof accountRoleSchema>;
