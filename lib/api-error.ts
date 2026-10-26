import { ApiError } from '@/api/client';

/** MSW / backend errors arrive as JSON in `ApiError.message`. */
export function apiErrorCode(error: ApiError): string {
  try {
    const parsed = JSON.parse(error.message) as { message?: string };
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    /* plain-text fallback */
  }
  return error.message;
}

export function isApiErrorCode(error: ApiError, code: string): boolean {
  return apiErrorCode(error) === code;
}
